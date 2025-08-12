
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getCitizens, type Citizen } from '@/lib/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';

type IncompleteFamily = {
    kkNumber: string;
    headOfFamily: string;
    expectedCount: number;
    currentCount: number;
    rt: string;
    rw: string;
};

const ITEMS_PER_PAGE = 3;

export function IncompleteFamiliesUserClient() {
  const [families, setFamilies] = useState<IncompleteFamily[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const fetchAndProcessData = useCallback(async () => {
    setLoading(true);
    const username = localStorage.getItem('username');
    if (!username) {
        toast({ title: 'Error', description: 'Anda harus login untuk melihat data ini.', variant: 'destructive'});
        setLoading(false);
        return;
    }

    try {
      const allCitizens = await getCitizens();
      const userCitizens = allCitizens.filter(c => c.username === username);

      const familiesMap = new Map<string, { head?: Citizen, members: Citizen[] }>();

      // First, identify all families the user has interacted with
      for (const citizen of userCitizens) {
        if (!familiesMap.has(citizen.kkNumber)) {
             familiesMap.set(citizen.kkNumber, { members: [] });
        }
      }

      // Then, populate members and find head for those families from all citizens data
       for (const citizen of allCitizens) {
           if (familiesMap.has(citizen.kkNumber)) {
               const family = familiesMap.get(citizen.kkNumber)!;
               family.members.push(citizen);
               if (citizen.familyRelationship === 'Kepala Keluarga') {
                   family.head = citizen;
               }
           }
       }


      const incompleteList: IncompleteFamily[] = [];
      for (const [kkNumber, familyData] of familiesMap.entries()) {
          const head = familyData.head;

          if (head) {
              const expectedCount = head.familyMembersCount;
              const currentCount = familyData.members.length;

              if (currentCount < expectedCount) {
                  incompleteList.push({
                      kkNumber,
                      headOfFamily: head.name,
                      expectedCount,
                      currentCount,
                      rt: head.rt,
                      rw: head.rw,
                  });
              }
          }
      }
      
      setFamilies(incompleteList);

    } catch (error) {
      console.error('Failed to fetch and process user family data:', error);
      toast({
        title: 'Gagal Mengambil Data',
        description: 'Tidak dapat memproses data keluarga Anda.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAndProcessData();
  }, [fetchAndProcessData]);

  const totalPages = Math.ceil(families.length / ITEMS_PER_PAGE);

  const paginatedFamilies = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return families.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [families, currentPage]);


  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kepala Keluarga</TableHead>
              <TableHead>No. KK</TableHead>
              <TableHead>RT/RW</TableHead>
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
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                </TableRow>
              ))
            ) : paginatedFamilies.length > 0 ? (
              paginatedFamilies.map((family) => (
                <TableRow key={family.kkNumber}>
                  <TableCell className="font-medium">{family.headOfFamily}</TableCell>
                  <TableCell>{family.kkNumber}</TableCell>
                  <TableCell>{`${family.rt}/${family.rw}`}</TableCell>
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
                <TableCell colSpan={4} className="h-24 text-center">
                  Semua data keluarga yang Anda entri sudah lengkap.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
         {families.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-muted-foreground">
                    Halaman {currentPage} dari {totalPages}
                </span>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        Sebelumnya
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    >
                        Berikutnya
                    </Button>
                </div>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
