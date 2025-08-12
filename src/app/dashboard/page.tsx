
'use client';

import { CitizenForm } from "@/components/dashboard/citizen-form";
import { IncompleteFamiliesUserClient } from "@/components/dashboard/incomplete-families-user-client";
import { MyDataClient } from "@/components/dashboard/my-data-client";
import { Separator } from "@/components/ui/separator";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ReportClient } from "@/components/dashboard/report-client";

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            <DashboardHeader />

            <Separator />

            <div>
                 <div className="mt-8">
                    <ReportClient />
                </div>
            </div>

            <Separator />

            <div>
                <h1 className="text-3xl font-bold font-headline tracking-tight">Entri Data Warga</h1>
                <p className="text-muted-foreground mt-1">
                    Silakan isi formulir di bawah ini dengan data yang benar.
                </p>
                <div className="mt-8">
                    <CitizenForm />
                </div>
            </div>

            <Separator />
            
            <div>
                 <h2 className="text-3xl font-bold font-headline tracking-tight">Data Warga Saya</h2>
                 <p className="text-muted-foreground mt-1">
                    Berikut adalah daftar data yang telah Anda entri. Anda dapat mengedit atau menghapusnya.
                </p>
                <div className="mt-8">
                    <MyDataClient />
                </div>
            </div>

            <Separator />
            
            <div>
                <h2 className="text-2xl font-bold font-headline tracking-tight">Keluarga Belum Lengkap (Entri Saya)</h2>
                <p className="text-muted-foreground mt-1">
                    Daftar kepala keluarga dari data yang Anda entri yang jumlah anggotanya belum lengkap.
                </p>
                <div className="mt-6">
                    <IncompleteFamiliesUserClient />
                </div>
            </div>

        </div>
    );
}
