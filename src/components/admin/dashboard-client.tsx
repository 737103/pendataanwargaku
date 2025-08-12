
'use client';

import { useState, useEffect } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Users, FileText, PersonStanding, Home, UserMinus } from 'lucide-react';
import { getDashboardStats, type InputStats } from '@/lib/firestore';
import { Skeleton } from '../ui/skeleton';

const chartConfig = {
  count: {
    label: 'Data Dientri',
  },
   completed: {
    label: 'Data Dientri (Lengkap)',
    color: 'hsl(var(--chart-2))',
  },
  inProgress: {
    label: 'Data Dientri (Proses)',
    color: 'hsl(var(--primary))',
  },
};

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

function CustomLegend() {
    return (
      <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground pt-4">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: 'hsl(var(--primary))' }}></span>
          <span>Entri Belum Lengkap</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-2))' }}></span>
          <span>Entri Lengkap</span>
        </div>
      </div>
    );
  }

export function DashboardClient() {
  const [stats, setStats] = useState<{
    totalSouls: number;
    totalKK: number;
    totalMale: number;
    totalFemale: number;
    pendingMembers: number;
    inputStats: InputStats[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const dashboardStats = await getDashboardStats();
        setStats(dashboardStats);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const chartData = stats?.inputStats || [];

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Jumlah Jiwa" value={stats?.totalSouls ?? 0} icon={Users} loading={loading} />
        <StatCard title="Jumlah Laki-laki" value={stats?.totalMale ?? 0} icon={PersonStanding} loading={loading} />
        <StatCard title="Jumlah Perempuan" value={stats?.totalFemale ?? 0} icon={PersonStanding} loading={loading} />
        <StatCard title="Jumlah KK" value={stats?.totalKK ?? 0} icon={Home} loading={loading} />
        <StatCard title="Anggota Belum Diinput" value={stats?.pendingMembers ?? 0} icon={UserMinus} loading={loading} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aktivitas Penginputan per Pengguna</CardTitle>
          <CardDescription>
            Jumlah data warga yang dientri oleh setiap pengguna. Ungu menandakan penginputan belum lengkap, sementara hijau berarti penginputan sudah lengkap.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {loading ? (
                <div className="h-[300px] w-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                </div>
            ) : (
            <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                        dataKey="username"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        angle={-45}
                        textAnchor="end"
                        />
                        <YAxis allowDecimals={false} />
                        <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dashed" />}
                        />
                        <Bar dataKey="count" radius={4}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.isComplete ? 'hsl(var(--chart-2))' : 'hsl(var(--primary))'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </ChartContainer>
            )}
             {!loading && chartData.length > 0 && <CustomLegend />}
        </CardContent>
      </Card>
    </div>
  );
}
