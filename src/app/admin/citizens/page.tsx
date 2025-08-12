
'use client';

import { CitizenDataClient } from "@/components/admin/citizen-data-client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft } from 'lucide-react';

export default function AdminCitizensPage() {
    const router = useRouter();

    return (
        <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight">Data Warga</h1>
            <p className="text-muted-foreground mt-1">
                Berikut adalah daftar semua data warga yang telah dientri.
            </p>
            <div className="mt-8">
                <CitizenDataClient />
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
