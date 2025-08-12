
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
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
import { ArrowRight, Loader2 } from 'lucide-react';
import { verifyUserCredentials } from '@/lib/firestore';

const formSchema = z.object({
  username: z.string().min(1, { message: 'Username tidak boleh kosong.' }),
  password: z.string().min(1, { message: 'Password tidak boleh kosong.' }),
});

export function AuthForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const user = await verifyUserCredentials(values.username, values.password);

      if (user) {
        localStorage.setItem('userRole', user.role);
        localStorage.setItem('username', values.username);
        toast({
          title: 'Login Berhasil!',
          description: `Anda masuk sebagai ${
            user.role === 'admin' ? 'Admin' : 'Pengguna'
          }.`,
        });

        if (user.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      } else {
        toast({
          title: 'Login Gagal',
          description: 'Username atau password salah.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Terjadi Kesalahan',
        description: 'Tidak dapat login saat ini. Coba lagi nanti.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Masukkan username Anda" {...field} />
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
                <Input type="password" placeholder="Masukkan password Anda" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Masuk
          {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </form>
    </Form>
  );
}
