
'use client';

import { AuthGuard } from '@/components/auth-guard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard role="admin">
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        {children}
      </div>
    </AuthGuard>
  );
}
