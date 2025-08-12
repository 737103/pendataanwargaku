"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FullPageLoading } from '@/components/loading';

type AuthGuardProps = {
  children: React.ReactNode;
  role: 'admin' | 'user';
};

export function AuthGuard({ children, role }: AuthGuardProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We need to use a timeout to allow the login page to set the userRole
    // in localStorage before this guard runs.
    setTimeout(() => {
        const storedRole = localStorage.getItem('userRole');
        if (storedRole === role) {
            setIsAuthorized(true);
        } else {
            router.push('/login');
        }
        setLoading(false);
    }, 500);
  }, [router, role]);

  if (loading) {
    return <FullPageLoading />;
  }

  if (!isAuthorized) {
    // Return null or a loading spinner while redirecting to avoid flashing content.
    return <FullPageLoading />;
  }

  return <>{children}</>;
}
