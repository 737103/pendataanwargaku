
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState, useCallback } from "react";
import { useDebounce } from 'use-debounce';

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  validateCitizenData,
  type ValidateCitizenDataOutput,
} from "@/ai/flows/validate-citizen-data";
import { AlertCircle, CheckCheck, Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addCitizen, getCitizenByKkNumber, isNikExists } from "@/lib/firestore";
import { useRouter } from "next/navigation";

const MAX_FILE_SIZE = 500 * 1024; // 500 KB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

const rtRwRegex = /^00\d{1,2}$/;

const occupationOptions = [
    "Belum/Tidak Bekerja",
    "Mengurus Rumah Tangga",
    "Karyawan Swasta",
    "Pegawai Negeri Sipil",
    "ASN P3K",
    "Honorer",
    "Buruh Harian Lepas",
    "Wiraswasta",
    "Pedagang",
    "Petani",
    "Lainnya",
  ];

const createFormSchema = () => z.object({
  name: z.string().min(1, "Nama tidak boleh kosong."),
  nik: z.string().length(16, "NIK harus 16 digit.").regex(/^\d+$/, "NIK harus berupa angka."),
  kkNumber: z.string().length(16, "No. KK harus 16 digit.").regex(/^\d+$/, "No. KK harus berupa angka."),
  address: z.string().min(1, "Alamat tidak boleh kosong."),
  rt: z.string().min(3, "RT minimal 3 digit").max(4, "RT maksimal 4 digit").regex(rtRwRegex, "Format RT tidak valid (cth: 001)"),
  rw: z.string().min(3, "RW minimal 3 digit").max(4, "RW maksimal 4 digit").regex(rtRwRegex, "Format RW tidak valid (cth: 001)"),
  contactInfo: z.string().min(10, "Info kontak harus memiliki setidaknya 10 karakter.").max(15, "Info kontak tidak boleh lebih dari 15 karakter."),
  gender: z.enum(["Laki-laki", "Perempuan"], { required_error: "Jenis kelamin harus dipilih." }),
  bloodType: z.string({ required_error: "Golongan darah harus dipilih." }).refine(val => val !== "", "Golongan darah harus dipilih."),
  occupation: z.string({ required_error: "Pekerjaan harus dipilih." }),
  otherOccupation: z.string().optional(),
  lastEducation: z.string({ required_error: "Pendidikan terakhir harus dipilih." }),
  religion: z.string({ required_error: "Agama harus dipilih." }),
  maritalStatus: z.string({ required_error: "Status perkawinan harus dipilih." }),
  familyRelationship: z.string({ required_error: "Hubungan dalam keluarga harus dipilih." }),
  familyMembersCount: z.coerce.number().min(1, "Jumlah anggota keluarga minimal 1."),
  documents: z.any()
    .optional()
    .refine((files) => !files || files.length === 0 || files?.[0]?.size <= MAX_FILE_SIZE, `Ukuran file maksimal adalah 500 KB.`)
    .refine((files) => !files || files.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type), "Hanya format .jpg, .jpeg, dan .png yang diterima."),
}).refine(data => {
    if (data.occupation === 'Lainnya') {
        return !!data.otherOccupation && data.otherOccupation.trim().length > 0;
    }
    return true;
}, {
    message: 'Pekerjaan lainnya harus diisi',
    path: ['otherOccupation'],
}).refine(data => {
    if (data.familyRelationship === 'Kepala Keluarga') {
        return data.documents && data.documents.length > 0;
    }
    return true;
}, {
    message: 'Dokumen wajib diunggah untuk Kepala Keluarga.',
    path: ['documents'],
}).superRefine(async (data, ctx) => {
    if (data.nik.length === 16 && /^\d+$/.test(data.nik)) {
        try {
            const nikExists = await isNikExists(data.nik);
            if (nikExists) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "NIK ini sudah terdaftar.",
                    path: ["nik"],
                });
            }
        } catch (error) {
            console.error("NIK validation failed:", error);
        }
    }
});


// Helper to convert file to data URI
const toDataUri = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export function CitizenForm() {
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] =
    useState<ValidateCitizenDataOutput | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const [isFamilyDataLocked, setIsFamilyDataLocked] = useState(false);

  const formSchema = createFormSchema();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema, {
        mode: "onChange",
    }),
    defaultValues: {
      name: "",
      nik: "",
      kkNumber: "",
      address: "",
      rt: "",
      rw: "",
      contactInfo: "",
      familyMembersCount: 1,
      otherOccupation: "",
      bloodType: "",
    },
  });
  
  const watchedOccupation = form.watch("occupation");
  const watchedFamilyRelationship = form.watch("familyRelationship");
  const watchedKkNumber = form.watch("kkNumber");
  const [debouncedKkNumber] = useDebounce(watchedKkNumber, 500);

  const checkKkNumber = useCallback(async (kk: string) => {
    if (kk.length !== 16 || !/^\d+$/.test(kk)) {
        setIsFamilyDataLocked(false);
        return;
    };

    const existingCitizen = await getCitizenByKkNumber(kk);
    if (existingCitizen) {
        form.setValue('address', existingCitizen.address, { shouldValidate: true });
        form.setValue('rt', existingCitizen.rt, { shouldValidate: true });
        form.setValue('rw', existingCitizen.rw, { shouldValidate: true });
        form.setValue('familyMembersCount', existingCitizen.familyMembersCount, { shouldValidate: true });
        setIsFamilyDataLocked(true);
        if (!isFamilyDataLocked) {
             toast({
                title: 'No. KK Ditemukan',
                description: 'Data keluarga (Alamat, RT, RW, dll) telah diisi otomatis.',
            });
        }
    } else {
        if(isFamilyDataLocked) {
            form.resetField('address');
            form.resetField('rt');
            form.resetField('rw');
            form.resetField('familyMembersCount');
        }
        setIsFamilyDataLocked(false);
    }
  }, [form, toast, isFamilyDataLocked]);

  useEffect(() => {
    checkKkNumber(debouncedKkNumber);
  }, [debouncedKkNumber, checkKkNumber]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setValidationResult(null);

    let documentUrls: string[] = [];
    if (values.documents?.length > 0) {
        try {
            const dataUri = await toDataUri(values.documents[0]);
            documentUrls.push(dataUri);
        } catch (error) {
            console.error("Error converting file to data URI:", error);
            toast({
                title: "File Error",
                description: "Gagal memproses file yang diunggah.",
                variant: "destructive",
            });
            setLoading(false);
            return;
        }
    }
    
    try {
      // For validation, we can just pass the filename, not the whole data URI
      const validationDocs = values.documents?.length > 0 ? [values.documents[0].name] : [];
      const result = await validateCitizenData({
        name: values.name,
        address: values.address,
        contactInfo: values.contactInfo,
        documents: validationDocs,
        nik: values.nik,
        kkNumber: values.kkNumber,
        bloodType: values.bloodType,
        rt: values.rt,
        rw: values.rw,
      });
      setValidationResult(result);

      if(result.isValid) {
        const username = localStorage.getItem('username');
        if (!username) {
            toast({
                title: "Otentikasi Gagal",
                description: "Username tidak ditemukan. Silakan login kembali.",
                variant: "destructive"
            });
            throw new Error("User not logged in");
        }
        
        const finalOccupation = values.occupation === 'Lainnya' ? values.otherOccupation : values.occupation;

        const { otherOccupation, ...citizenData } = values;

        await addCitizen({
            ...citizenData,
            occupation: finalOccupation!,
            documents: documentUrls, // Save the data URI to Firestore
            username: username
        });
        toast({
            title: "Data Terkirim",
            description: "Data Anda telah berhasil divalidasi dan disimpan.",
            variant: "default"
        })
        form.reset();
        setIsFamilyDataLocked(false);
        // This reloads the page to show the new data in the table
        router.refresh();
      }
    } catch (error: any) {
      console.error("Validation or submission error:", error);
      if (error.message && (error.message.includes('503 Service Unavailable') || error.message.includes('overloaded'))) {
        toast({
            title: "Layanan Validasi Sedang Sibuk",
            description: "Layanan validasi AI sedang mengalami beban tinggi. Silakan coba kirimkan kembali dalam beberapa saat.",
            variant: "destructive",
        });
      } else {
        toast({
            title: "Terjadi Kesalahan",
            description: "Tidak dapat memvalidasi atau mengirim data saat ini. Coba lagi nanti.",
            variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nama Lengkap</FormLabel>
                    <FormControl>
                        <Input placeholder="cth. Budi Santoso" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="nik"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>NIK</FormLabel>
                    <FormControl>
                        <Input placeholder="16 digit NIK" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="kkNumber"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>No. KK</FormLabel>
                    <FormControl>
                        <Input placeholder="16 digit No. KK" {...field} />
                    </FormControl>
                    <FormDescription>
                        Jika No. KK sudah ada, data keluarga akan diisi otomatis.
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="contactInfo"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nomor Telepon</FormLabel>
                    <FormControl>
                        <Input placeholder="cth. 081234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
             <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Alamat Lengkap</FormLabel>
                    <FormControl>
                        <Textarea
                        placeholder="cth. Jl. Pahlawan No. 10, Semarang"
                        {...field}
                        disabled={isFamilyDataLocked}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField
                control={form.control}
                name="rt"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>RT</FormLabel>
                    <FormControl>
                        <Input placeholder="cth. 001" {...field} disabled={isFamilyDataLocked} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="rw"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>RW</FormLabel>
                    <FormControl>
                        <Input placeholder="cth. 002" {...field} disabled={isFamilyDataLocked} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                    <FormLabel>Jenis Kelamin</FormLabel>
                    <FormControl>
                        <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                        >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                            <RadioGroupItem value="Laki-laki" />
                            </FormControl>
                            <FormLabel className="font-normal">Laki-laki</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                            <RadioGroupItem value="Perempuan" />
                            </FormControl>
                            <FormLabel className="font-normal">Perempuan</FormLabel>
                        </FormItem>
                        </RadioGroup>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                    control={form.control}
                    name="bloodType"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Golongan Darah</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Pilih golongan darah" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="A">A</SelectItem>
                                <SelectItem value="B">B</SelectItem>
                                <SelectItem value="AB">AB</SelectItem>
                                <SelectItem value="O">O</SelectItem>
                                <SelectItem value="Tidak tahu">Tidak tahu</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="occupation"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Pekerjaan</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Pilih pekerjaan" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {occupationOptions.map(opt => (
                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                {watchedOccupation === 'Lainnya' && (
                     <FormField
                     control={form.control}
                     name="otherOccupation"
                     render={({ field }) => (
                         <FormItem>
                         <FormLabel>Pekerjaan Lainnya</FormLabel>
                         <FormControl>
                             <Input placeholder="Sebutkan pekerjaan" {...field} />
                         </FormControl>
                         <FormMessage />
                         </FormItem>
                     )}
                     />
                )}
                <FormField
                    control={form.control}
                    name="lastEducation"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Pendidikan Terakhir</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Pilih pendidikan" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Tidak-belum sekolah">Tidak-belum sekolah</SelectItem>
                                <SelectItem value="Tamat SD-sederajat">Tamat SD-sederajat</SelectItem>
                                <SelectItem value="Tamat SLTP-sederajat">Tamat SLTP-sederajat</SelectItem>
                                <SelectItem value="Tamat SLTA-sederajat">Tamat SLTA-sederajat</SelectItem>
                                <SelectItem value="Diploma III">Diploma III</SelectItem>
                                <SelectItem value="Diploma III-sarjana Muda">Diploma III-sarjana Muda</SelectItem>
                                <SelectItem value="Strata I-Sarjana">Strata I-Sarjana</SelectItem>
                                <SelectItem value="Strata II-Magister">Strata II-Magister</SelectItem>
                                <SelectItem value="Strata III-Doktor">Strata III-Doktor</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="religion"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Agama</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Pilih agama" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Islam">Islam</SelectItem>
                                <SelectItem value="Kristen">Kristen</SelectItem>
                                <SelectItem value="Katolik">Katolik</SelectItem>
                                <SelectItem value="Hindu">Hindu</SelectItem>
                                <SelectItem value="Buddha">Buddha</SelectItem>
                                <SelectItem value="Khonghucu">Khonghucu</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="maritalStatus"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Status Perkawinan</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Pilih status" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Belum Kawin">Belum Kawin</SelectItem>
                                <SelectItem value="Kawin">Kawin</SelectItem>
                                <SelectItem value="Cerai Hidup">Cerai Hidup</SelectItem>
                                <SelectItem value="Cerai Mati">Cerai Mati</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="familyRelationship"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Hubungan dalam Keluarga</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Pilih hubungan" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Kepala Keluarga">Kepala Keluarga</SelectItem>
                                <SelectItem value="Istri">Istri</SelectItem>
                                <SelectItem value="Anak">Anak</SelectItem>
                                <SelectItem value="Family Lainnya">Family Lainnya</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="familyMembersCount"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Jumlah Anggota Keluarga</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="cth. 4" {...field} disabled={isFamilyDataLocked} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            {watchedFamilyRelationship === 'Kepala Keluarga' && (
                <FormField
                control={form.control}
                name="documents"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Upload Dokumen (KTP/KK)</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <Upload className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input type="file" className="pl-10" onChange={(e) => field.onChange(e.target.files)} accept="image/png, image/jpeg, image/jpg" />
                        </div>
                    </FormControl>
                    <FormDescription>
                        Unggah pindaian dokumen Anda dalam format JPG atau PNG (maks. 500 KB).
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
            )}

            {validationResult && (
              <Alert variant={validationResult.isValid ? "default" : "destructive"} className={validationResult.isValid ? 'border-green-500 text-green-600' : ''}>
                {validationResult.isValid ? <CheckCheck className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle>
                  {validationResult.isValid
                    ? "Validasi Berhasil"
                    : "Validasi Gagal"}
                </AlertTitle>
                <AlertDescription>
                  {validationResult.isValid
                    ? "Data Anda terlihat bagus dan siap untuk diproses."
                    : (
                        <ul>
                            {validationResult.validationErrors.map((error, index) => (
                                <li key={index} className="list-disc ml-4">{error}</li>
                            ))}
                        </ul>
                      )}
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={loading} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Memvalidasi..." : "Validasi & Kirim"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
