
'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, FileText, PersonStanding, Home, CheckCircle, XCircle } from 'lucide-react';
import { getUserDashboardStats, getUserFromUsername } from '@/lib/firestore';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';

type StatCardProps = {
  title: string;
  value: string | number;
  icon: React.ElementType;
  loading: boolean;
};

function StatCard({ title, value, icon: Icon, loading }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

type CompletionData = {
    name: string;
    value: number;
    color: string;
}

export function ReportClient() {
  const [stats, setStats] = useState<{
    totalSouls: number;
    totalKK: number;
    totalMale: number;
    totalFemale: number;
    completionData: CompletionData[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    async function fetchStatsAndUser() {
        setLoading(true);
        const username = localStorage.getItem('username');
        if (!username) {
            toast({ title: 'Error', description: 'Anda harus login untuk melihat data ini.', variant: 'destructive' });
            setLoading(false);
            return;
        }

      try {
        const [dashboardStats, user] = await Promise.all([
            getUserDashboardStats(username),
            getUserFromUsername(username)
        ]);

        setStats(dashboardStats);
        if(user) {
            setUserName(user.name);
        }

      } catch (error) {
        console.error('Failed to fetch user dashboard stats:', error);
         toast({
          title: 'Gagal Mengambil Laporan',
          description: 'Terjadi kesalahan saat memuat data laporan Anda.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
    fetchStatsAndUser();
  }, [toast]);

  const chartData = stats?.completionData || [];
  const totalChartValue = chartData.reduce((acc, item) => acc + item.value, 0);


  return (
    <div className="space-y-4">
        <div>
            <h2 className="text-3xl font-bold font-headline tracking-tight">
                Laporan Data Saya: {loading ? <Skeleton className="h-8 w-48 inline-block" /> : <span>{userName}</span>}
            </h2>
            <p className="text-muted-foreground mt-1">
                Berikut adalah ringkasan data yang telah Anda entri.
            </p>
        </div>
        <div className="grid gap-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Jumlah Jiwa (Entri Saya)" value={stats?.totalSouls ?? 0} icon={Users} loading={loading} />
            <StatCard title="Jumlah Laki-laki (Entri Saya)" value={stats?.totalMale ?? 0} icon={PersonStanding} loading={loading} />
            <StatCard title="Jumlah Perempuan (Entri Saya)" value={stats?.totalFemale ?? 0} icon={PersonStanding} loading={loading} />
            <StatCard title="Jumlah KK (Entri Saya)" value={stats?.totalKK ?? 0} icon={Home} loading={loading} />
        </div>

        <Card>
            <CardHeader>
            <CardTitle>Kelengkapan Anggota Keluarga (Entri Saya)</CardTitle>
            <CardDescription>
                Persentase jumlah anggota keluarga yang telah Anda input dibandingkan dengan yang belum.
            </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="h-[300px] w-full flex items-center justify-center">
                        <Skeleton className="h-full w-full" />
                    </div>
                ) : totalChartValue > 0 ? (
                    <div className="min-h-[300px] w-full">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value, name) => [`${value} orang`, name]}/>
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-[300px] flex flex-col items-center justify-center text-center">
                        <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                        <h3 className="text-lg font-medium">Data Lengkap!</h3>
                        <p className="text-muted-foreground">
                            Semua anggota keluarga dari data yang Anda entri sudah lengkap.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
        </div>
    </div>
  );
}
