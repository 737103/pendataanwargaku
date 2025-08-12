
'use client';

import { Button } from "@/components/ui/button";
import { WargaDataLogo } from "@/components/icons";
import { LogOut } from 'lucide-react';
import { useRouter } from "next/navigation";

export function DashboardHeader() {
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('userRole');
        localStorage.removeItem('username');
        router.push('/login');
    };

    return (
        <header className="flex items-center justify-between w-full">
            <WargaDataLogo />
            <div className="flex items-center gap-4">
                <Button variant="destructive" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>Keluar</span>
                </Button>
            </div>
        </header>
    );
}
