
'use client';

import { useState } from 'react';
import { UserDataClient } from "@/components/admin/user-data-client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft, UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AddUserForm } from '@/components/admin/add-user-form';


export default function AdminUsersPage() {
    const router = useRouter();
    const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
    // We add a key to the UserDataClient to force a re-render when a user is added.
    const [userDataClientKey, setUserDataClientKey] = useState(Date.now());

    const onUserAdded = () => {
        setIsAddUserDialogOpen(false);
        setUserDataClientKey(Date.now()); // Update the key to trigger re-fetch in client
    }

    return (
        <div>
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold font-headline tracking-tight">Data Pengguna</h1>
                    <p className="text-muted-foreground mt-1">
                        Berikut adalah daftar semua pengguna yang terdaftar dalam sistem.
                    </p>
                </div>
                 <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Tambah Pengguna Baru
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                        <DialogTitle>Tambah Pengguna Baru</DialogTitle>
                        <DialogDescription>
                            Gunakan formulir di bawah ini untuk membuat akun pengguna baru.
                        </DialogDescription>
                        </DialogHeader>
                        <AddUserForm onSuccess={onUserAdded} />
                    </DialogContent>
                </Dialog>
            </div>
            <div className="mt-8">
                <UserDataClient key={userDataClientKey} />
            </div>
            <div className="mt-8">
                <Button onClick={() => router.push('/admin')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali
                </Button>
            </div>
        </div>
    );
}
