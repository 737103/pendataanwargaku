import { AuthForm } from '@/components/auth/auth-form';
import { WargaDataLogo } from '@/components/icons';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function LoginPage() {
  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center p-4"
      style={{
        backgroundImage: `url('https://plus.unsplash.com/premium_photo-1661963212517-830bbb7d76fc?q=80&w=1086&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black/50 z-0" />
      <div className="w-full max-w-md z-10">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <WargaDataLogo />
            </div>
            <CardTitle className="font-headline text-2xl">
              Selamat Datang
            </CardTitle>
            <CardDescription>
              Masuk untuk mengelola data warga atau mengajukan data baru.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AuthForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
