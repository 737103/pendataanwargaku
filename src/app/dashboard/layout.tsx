'use client';

import { AuthGuard } from '@/components/auth-guard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard role="user">
       <div 
        className="relative min-h-screen bg-background"
        style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTM5fHxsYXRhcnxlbnwwfHwwfHx8MA%3D%3D')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
        }}
      >
        <div className="absolute inset-0 bg-black/30 z-0" />
        <div className="relative z-10 container mx-auto p-4 sm:p-6 lg:p-8">
           <div className="bg-card/80 backdrop-blur-sm p-6 rounded-lg shadow-lg">
            {children}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
