
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
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
  } from "@/components/ui/select"
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { type User, updateUser } from '@/lib/firestore';

const formSchema = z.object({
  name: z.string().min(1, 'Nama tidak boleh kosong'),
  username: z.string().min(1, 'Username tidak boleh kosong'),
  password: z.string().optional(),
  nik: z.string().min(16, 'NIK harus 16 digit').max(16, 'NIK harus 16 digit'),
  phone: z.string().min(10, 'Nomor HP minimal 10 digit'),
  address: z.string().min(1, 'Alamat tidak boleh kosong'),
  status: z.enum(['active', 'disabled']),
});

type EditUserFormProps = {
    user: User;
    onSuccess: () => void;
    isEditingSelf?: boolean;
};

export function EditUserForm({ user, onSuccess, isEditingSelf = false }: EditUserFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user.name,
      username: user.username,
      password: '',
      nik: user.nik,
      phone: user.phone,
      address: user.address,
      status: user.status,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const updateData: Partial<User> = {
        name: values.name,
        username: values.username,
        nik: values.nik,
        phone: values.phone,
        address: values.address,
        status: values.status,
      };

      if (values.password) {
        updateData.password = values.password;
      }

      await updateUser(user.id, updateData);
      toast({
        title: 'Pengguna Diperbarui',
        description: `Data untuk "${values.name}" telah berhasil diperbarui.`,
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to update user:', error);
      toast({
        title: 'Gagal Memperbarui Pengguna',
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
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="cth. budi.santoso" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Password Baru</FormLabel>
                <FormControl>
                <Input type="password" placeholder="Kosongkan jika tidak ingin diubah" {...field} />
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
                <Input placeholder="Masukkan 16 digit NIK" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
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
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alamat</FormLabel>
              <FormControl>
                <Input placeholder="cth. Jl. Pahlawan No. 10" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!isEditingSelf && (
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status pengguna" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="disabled">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
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
