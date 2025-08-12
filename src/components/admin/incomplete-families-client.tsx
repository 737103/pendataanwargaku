
'use client';

import { useState, useEffect, useMemo } from 'react';
import { getCitizens, type Citizen } from '@/lib/firestore';
import * as XLSX from 'xlsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { Download } from 'lucide-react';

type IncompleteFamily = {
    kkNumber: string;
    headOfFamily: string;
    expectedCount: number;
    currentCount: number;
    rt: string;
    rw: string;
    username: string;
};

const INITIAL_VISIBLE_COUNT = 5;

export function IncompleteFamiliesClient() {
  const [families, setFamilies] = useState<IncompleteFamily[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAndProcessData = async () => {
      setLoading(true);
      try {
        const citizens = await getCitizens();
        
        const familiesMap = new Map<string, { members: Citizen[], head?: Citizen }>();

        // Group citizens by kkNumber
        for (const citizen of citizens) {
            if (!familiesMap.has(citizen.kkNumber)) {
                familiesMap.set(citizen.kkNumber, { members: [], head: undefined });
            }
            const family = familiesMap.get(citizen.kkNumber)!;
            family.members.push(citizen);
            if (citizen.familyRelationship === 'Kepala Keluarga') {
                family.head = citizen;
            }
        }

        const incompleteList: IncompleteFamily[] = [];
        for (const [kkNumber, familyData] of familiesMap.entries()) {
            if (familyData.head) {
                const expectedCount = familyData.head.familyMembersCount;
                const currentCount = familyData.members.length;

                if (currentCount < expectedCount) {
                    incompleteList.push({
                        kkNumber,
                        headOfFamily: familyData.head.name,
                        expectedCount,
                        currentCount,
                        rt: familyData.head.rt,
                        rw: familyData.head.rw,
                        username: familyData.head.username,
                    });
                }
            }
        }
        
        setFamilies(incompleteList);

      } catch (error) {
        console.error('Failed to fetch and process family data:', error);
        toast({
          title: 'Gagal Mengambil Data',
          description: 'Tidak dapat memproses data keluarga.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAndProcessData();
  }, [toast]);

  const visibleFamilies = useMemo(() => {
    return families.slice(0, visibleCount);
  }, [families, visibleCount]);

  const handleShowMore = () => {
    setVisibleCount(prevCount => prevCount + 5);
  };

  const handleShowLess = () => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }

  const handleDownloadXLS = () => {
    const dataToExport = families.map(f => ({
      'Kepala Keluarga': f.headOfFamily,
      'No. KK': f.kkNumber,
      'RT/RW': `${f.rt}/${f.rw}`,
      'Anggota Dientri': f.currentCount,
      'Anggota Diharapkan': f.expectedCount,
      'Kekurangan': f.expectedCount - f.currentCount,
      'Penginput': f.username
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Keluarga Belum Lengkap');
    XLSX.writeFile(workbook, 'keluarga_belum_lengkap.xlsx');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Keluarga Belum Lengkap</CardTitle>
        <Button 
            onClick={handleDownloadXLS} 
            className="bg-accent text-accent-foreground hover:bg-accent/90" 
            disabled={loading || families.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Download XLS
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kepala Keluarga</TableHead>
              <TableHead>No. KK</TableHead>
              <TableHead>RT/RW</TableHead>
              <TableHead>Penginput</TableHead>
              <TableHead className="w-[250px]">Progres Entri</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                </TableRow>
              ))
            ) : visibleFamilies.length > 0 ? (
              visibleFamilies.map((family) => (
                <TableRow key={family.kkNumber}>
                  <TableCell className="font-medium">{family.headOfFamily}</TableCell>
                  <TableCell>{family.kkNumber}</TableCell>
                  <TableCell>{`${family.rt}/${family.rw}`}</TableCell>
                  <TableCell>{family.username}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        <Progress value={(family.currentCount / family.expectedCount) * 100} className="w-40" />
                        <span className="text-muted-foreground text-xs">{`${family.currentCount} dari ${family.expectedCount}`}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Semua data keluarga sudah lengkap.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
         {families.length > INITIAL_VISIBLE_COUNT && (
            <div className="mt-4 flex justify-center">
              {visibleCount < families.length ? (
                 <Button onClick={handleShowMore} variant="outline">
                    Tampilkan lebih banyak ({families.length - visibleCount} lagi)
                 </Button>
              ) : (
                <Button onClick={handleShowLess} variant="outline">
                    Tampilkan lebih sedikit
                </Button>
              )}
            </div>
          )}
      </CardContent>
    </Card>
  );
}
