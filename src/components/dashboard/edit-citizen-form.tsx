
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import { type Citizen, updateCitizen, isNikExists } from '@/lib/firestore';
import { Textarea } from '../ui/textarea';
import { useRouter } from 'next/navigation';

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

const createFormSchema = (originalNik: string, citizenId: string) => z.object({
  name: z.string().min(1, "Nama tidak boleh kosong."),
  nik: z.string().length(16, "NIK harus 16 digit.").regex(/^\d+$/, "NIK harus berupa angka."),
  kkNumber: z.string().length(16, "No. KK harus 16 digit.").regex(/^\d+$/, "No. KK harus berupa angka."),
  address: z.string().min(1, "Alamat tidak boleh kosong."),
  rt: z.string().min(3, "RT minimal 3 digit").max(4, "RT maksimal 4 digit").regex(rtRwRegex, "Format RT tidak valid (cth: 001)"),
  rw: z.string().min(3, "RW minimal 3 digit").max(4, "RW maksimal 4 digit").regex(rtRwRegex, "Format RW tidak valid (cth: 001)"),
  contactInfo: z.string().min(10, "Nomor HP minimal 10 digit").max(15, "Nomor HP maksimal 15 digit."),
  gender: z.enum(["Laki-laki", "Perempuan"]),
  bloodType: z.string({ required_error: "Golongan darah harus dipilih." }).refine(val => val !== "", "Golongan darah harus dipilih."),
  occupation: z.string({ required_error: "Pekerjaan harus dipilih." }),
  otherOccupation: z.string().optional(),
  lastEducation: z.string(),
  religion: z.string(),
  maritalStatus: z.string(),
  familyRelationship: z.string(),
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
        const hasExistingDocument = Array.isArray(data.documents) && data.documents.length > 0 && typeof data.documents[0] === 'string';
        const hasNewFile = data.documents instanceof FileList && data.documents.length > 0;
        
        if (hasExistingDocument) return true;
        return hasNewFile;
    }
    return true;
}, {
    message: 'Dokumen wajib diunggah untuk Kepala Keluarga.',
    path: ['documents'],
}).superRefine(async (data, ctx) => {
    if (data.nik !== originalNik && data.nik.length === 16 && /^\d+$/.test(data.nik)) {
        try {
            const nikExists = await isNikExists(data.nik, citizenId);
            if (nikExists) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "NIK ini sudah terdaftar untuk warga lain.",
                    path: ["nik"],
                });
            }
        } catch (error) {
            console.error("NIK validation failed during edit:", error);
        }
    }
});


type EditCitizenFormProps = {
    citizen: Citizen;
    onSuccess: () => void;
};

// Helper to convert file to data URI
const toDataUri = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });


export function EditCitizenForm({ citizen, onSuccess }: EditCitizenFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const formSchema = createFormSchema(citizen.nik, citizen.id);

  const isOtherOccupation = !occupationOptions.includes(citizen.occupation);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...citizen,
      name: citizen.name,
      nik: citizen.nik,
      kkNumber: citizen.kkNumber,
      address: citizen.address,
      rt: citizen.rt,
      rw: citizen.rw,
      contactInfo: citizen.contactInfo,
      gender: citizen.gender,
      bloodType: citizen.bloodType,
      occupation: isOtherOccupation ? "Lainnya" : citizen.occupation,
      otherOccupation: isOtherOccupation ? citizen.occupation : "",
      lastEducation: citizen.lastEducation,
      religion: citizen.religion,
      maritalStatus: citizen.maritalStatus,
      familyRelationship: citizen.familyRelationship,
      familyMembersCount: citizen.familyMembersCount,
      documents: citizen.documents || [],
    },
  });
  
  const watchedOccupation = form.watch("occupation");
  const watchedFamilyRelationship = form.watch("familyRelationship");


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const finalOccupation = values.occupation === 'Lainnya' ? values.otherOccupation : values.occupation;
      
      const { otherOccupation, ...citizenData } = values;

      const updateData: Partial<Omit<Citizen, 'id' | 'username'>> = {
        ...citizenData,
        occupation: finalOccupation,
      };

      if (values.documents && values.documents instanceof FileList && values.documents.length > 0) {
        try {
            const dataUri = await toDataUri(values.documents[0]);
            updateData.documents = [dataUri];
        } catch (error) {
            console.error("Error converting file to data URI:", error);
            toast({
                title: "File Error",
                description: "Gagal memproses file baru yang diunggah.",
                variant: "destructive",
            });
            setLoading(false);
            return;
        }
      } else {
        // If no new file is uploaded, keep existing documents
        updateData.documents = citizen.documents;
      }

      await updateCitizen(citizen.id, updateData);
      toast({
        title: 'Data Diperbarui',
        description: `Data untuk "${values.name}" telah berhasil diperbarui.`,
      });
      onSuccess();
      router.refresh();
    } catch (error) {
      console.error('Failed to update citizen data:', error);
      toast({
        title: 'Gagal Memperbarui Data',
        description: 'Terjadi kesalahan saat menyimpan perubahan.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="kkNumber"
            render={({ field }) => (
                <FormItem>
                <FormLabel>No. KK</FormLabel>
                <FormControl>
                    <Input placeholder="16 digit No. KK" {...field} />
                </FormControl>
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
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="rt"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>RT</FormLabel>
                    <FormControl>
                        <Input placeholder="cth. 001" {...field} />
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
                        <Input placeholder="cth. 002" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <Input type="number" placeholder="cth. 4" {...field} />
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
                render={({ field: { onChange, value, ...rest } }) => (
                <FormItem>
                    <FormLabel>Upload Dokumen Baru (Opsional)</FormLabel>
                    <FormControl>
                        <div className="relative">
                        <Upload className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input type="file" className="pl-10" onChange={(e) => onChange(e.target.files)} accept="image/png, image/jpeg, image/jpg" {...rest} />
                        </div>
                    </FormControl>
                    <FormDescription>
                    Kosongkan jika tidak ingin mengubah dokumen (maks. 500 KB).
                    </FormDescription>
                    <FormMessage />
                </FormItem>
                )}
            />
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Simpan Perubahan
        </Button>
      </form>
    </Form>
  );
}

    
