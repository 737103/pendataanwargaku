
'use client';

import { DashboardClient } from "@/components/admin/dashboard-client";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, LogOut, User as UserIcon, FileText } from 'lucide-react';
import { useRouter } from "next/navigation";
import { WargaDataLogo } from "@/components/icons";
import { useEffect, useState } from "react";
import { type User, getUserFromUsername } from "@/lib/firestore";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EditUserForm } from "@/components/admin/edit-user-form";
import { IncompleteFamiliesClient } from "@/components/admin/incomplete-families-client";
import { Separator } from "@/components/ui/separator";

export default function AdminDashboardPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            const username = localStorage.getItem('username');
            if (username) {
                const user = await getUserFromUsername(username);
                setCurrentUser(user);
            }
        };
        fetchUser();
    }, [isEditDialogOpen]);


    const handleLogout = () => {
      localStorage.removeItem('userRole');
      localStorage.removeItem('username');
      router.push('/login');
    };

    const onUpdateSuccess = () => {
        setIsEditDialogOpen(false);
    }

    return (
        <div 
            className="relative flex flex-col min-h-screen"
            style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1506792006437-256b665541e2?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fHdhcm5hfGVufDB8fDB8fHww')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
            }}
        >
            <div className="absolute inset-0 bg-black/30 z-0" />
            <div className="relative z-10 flex flex-col flex-grow">
                <header className="sticky top-0 z-10 w-full bg-card/80 backdrop-blur-sm border-b">
                    <div className="container flex items-center justify-between h-16 px-4 mx-auto sm:px-6 lg:px-8">
                        <WargaDataLogo />
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => router.push('/admin/citizens')}>
                                <FileText />
                                <span>Data Warga</span>
                            </Button>
                            <Button variant="outline" onClick={() => router.push('/admin/users')}>
                                <Users />
                                <span>Data Pengguna</span>
                            </Button>
                            <Button variant="outline" onClick={() => router.push('/admin')}>
                                <LayoutDashboard />
                                <span>Dasbor</span>
                            </Button>
                            <Button variant="outline" onClick={() => setIsEditDialogOpen(true)} disabled={!currentUser}>
                                <UserIcon />
                                <span>Edit Profil</span>
                            </Button>
                            <Button variant="destructive" onClick={handleLogout}>
                                <LogOut size={16} />
                                <span>Keluar</span>
                            </Button>
                        </div>
                    </div>
                </header>
                
                <main className="container px-4 py-8 mx-auto sm:px-6 lg:px-8 flex-grow">
                    <div className="space-y-8 bg-card/80 backdrop-blur-sm p-6 rounded-lg shadow-lg">
                        <div>
                            <h1 className="text-3xl font-bold font-headline tracking-tight">Dasbor Admin</h1>
                            <p className="text-muted-foreground mt-1">
                                Selamat datang! Berikut adalah ringkasan data warga.
                            </p>
                        </div>

                        <DashboardClient />
                        
                        <Separator />
                        
                        <div>
                            <div className="mt-6">
                                <IncompleteFamiliesClient />
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Profil</DialogTitle>
                    <DialogDescription>
                    Lakukan perubahan pada data profil Anda. Klik simpan jika sudah selesai.
                    </DialogDescription>
                </DialogHeader>
                {currentUser && <EditUserForm user={currentUser} onSuccess={onUpdateSuccess} isEditingSelf={true} />}
                </DialogContent>
            </Dialog>
        </div>
    );
}
