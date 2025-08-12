
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
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { type User, addUser } from '@/lib/firestore';

const formSchema = z.object({
  name: z.string().min(1, 'Nama tidak boleh kosong'),
  username: z.string().min(1, 'Username tidak boleh kosong'),
  password: z.string().min(1, 'Password tidak boleh kosong'),
  nik: z.string().min(16, 'NIK harus 16 digit').max(16, 'NIK harus 16 digit'),
  phone: z.string().min(10, 'Nomor HP minimal 10 digit'),
  address: z.string().min(1, 'Alamat tidak boleh kosong'),
});

type AddUserFormProps = {
    onSuccess: () => void;
};


export function AddUserForm({ onSuccess }: AddUserFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      username: '',
      password: '',
      nik: '',
      phone: '',
      address: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const newUser: Omit<User, 'id'> = {
        ...values,
        role: 'user',
        status: 'active',
      };
      await addUser(newUser);
      toast({
        title: 'Pengguna Ditambahkan',
        description: `Pengguna baru "${values.name}" telah berhasil dibuat.`,
      });
      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Failed to add user:', error);
      toast({
        title: 'Gagal Menambahkan Pengguna',
        description: 'Terjadi kesalahan saat menyimpan pengguna baru.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
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
                <FormLabel>Password</FormLabel>
                <FormControl>
                <Input type="password" placeholder="Masukkan password" {...field} />
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
        <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Tambah Pengguna
        </Button>
        </form>
    </Form>
  );
}
