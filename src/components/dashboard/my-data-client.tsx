
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getCitizensByUsername, deleteCitizen, type Citizen } from '@/lib/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Eye, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EditCitizenForm } from './edit-citizen-form';
import { CitizenDetailView } from '../admin/citizen-detail-view';
import { Input } from '../ui/input';

const ITEMS_PER_PAGE = 3;

export function MyDataClient() {
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [loading, setLoading] = useState(true);
  const [citizenToDelete, setCitizenToDelete] = useState<Citizen | null>(null);
  const [citizenToEdit, setCitizenToEdit] = useState<Citizen | null>(null);
  const [citizenToView, setCitizenToView] = useState<Citizen | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { toast } = useToast();

  const fetchUserCitizens = useCallback(async () => {
    setLoading(true);
    const username = localStorage.getItem('username');
    if (!username) {
        toast({ title: 'Error', description: 'Anda harus login untuk melihat data ini.', variant: 'destructive'});
        setLoading(false);
        return;
    }
    try {
      const citizenList = await getCitizensByUsername(username);
      setCitizens(citizenList);
    } catch (error) {
      console.error('Failed to fetch user citizens:', error);
      toast({
        title: 'Gagal Mengambil Data',
        description: 'Tidak dapat mengambil daftar data Anda.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUserCitizens();
  }, [fetchUserCitizens]);

  const filteredCitizens = useMemo(() => {
    setCurrentPage(1); // Reset to first page on search
    if (!searchTerm) {
      return citizens;
    }
    return citizens.filter(citizen => 
      citizen.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      citizen.nik.includes(searchTerm) ||
      citizen.kkNumber.includes(searchTerm)
    );
  }, [citizens, searchTerm]);

  const totalPages = Math.ceil(filteredCitizens.length / ITEMS_PER_PAGE);

  const paginatedCitizens = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCitizens.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCitizens, currentPage]);


  const handleDeleteClick = (citizen: Citizen) => {
    setCitizenToDelete(citizen);
    setIsDeleteDialogOpen(true);
  };

  const handleEditClick = (citizen: Citizen) => {
    setCitizenToEdit(citizen);
    setIsEditDialogOpen(true);
  };
  
  const handleViewClick = (citizen: Citizen) => {
    setCitizenToView(citizen);
    setIsViewDialogOpen(true);
  };


  const confirmDelete = async () => {
    if (!citizenToDelete) return;
    try {
      await deleteCitizen(citizenToDelete.id);
      toast({
        title: 'Data Dihapus',
        description: `Data untuk "${citizenToDelete.name}" telah berhasil dihapus.`,
      });
      fetchUserCitizens(); 
    } catch (error) {
      console.error('Failed to delete citizen data:', error);
      toast({
        title: 'Gagal Menghapus',
        description: 'Terjadi kesalahan saat menghapus data.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setCitizenToDelete(null);
    }
  };

  const onUpdateSuccess = () => {
    setIsEditDialogOpen(false);
    setCitizenToEdit(null);
    fetchUserCitizens();
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Data Saya</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input 
                placeholder="Cari berdasarkan Nama, NIK, atau No. KK..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>NIK</TableHead>
                <TableHead>No. KK</TableHead>
                <TableHead>Hubungan Keluarga</TableHead>
                <TableHead>Alamat</TableHead>
                <TableHead>No. Telepon</TableHead>
                <TableHead>Dokumen</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                         <Skeleton className="h-8 w-8" />
                         <Skeleton className="h-8 w-8" />
                         <Skeleton className="h-8 w-8" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedCitizens.length > 0 ? (
                paginatedCitizens.map((citizen) => (
                  <TableRow key={citizen.id}>
                    <TableCell className="font-medium">{citizen.name}</TableCell>
                    <TableCell>{citizen.nik}</TableCell>
                    <TableCell>{citizen.kkNumber}</TableCell>
                    <TableCell>{citizen.familyRelationship}</TableCell>
                    <TableCell>{citizen.address}</TableCell>
                    <TableCell>{citizen.contactInfo}</TableCell>
                    <TableCell>{citizen.documents && citizen.documents.length > 0 ? 'Dokumen Terunggah' : 'Tidak ada'}</TableCell>
                    <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" size="icon" onClick={() => handleViewClick(citizen)} title="Lihat Detail">
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">Lihat Detail</span>
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => handleEditClick(citizen)} title="Edit">
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                            </Button>
                            <Button variant="destructive" size="icon" onClick={() => handleDeleteClick(citizen)} title="Hapus">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Hapus</span>
                            </Button>
                        </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    {searchTerm ? `Tidak ada data yang cocok dengan "${searchTerm}".` : 'Anda belum mengentri data.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {filteredCitizens.length > ITEMS_PER_PAGE && (
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus data untuk "{citizenToDelete?.name}" secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Edit Data Warga</DialogTitle>
            <DialogDescription>
              Lakukan perubahan pada data Anda. Klik simpan jika sudah selesai.
            </DialogDescription>
          </DialogHeader>
          {citizenToEdit && <EditCitizenForm citizen={citizenToEdit} onSuccess={onUpdateSuccess} />}
        </DialogContent>
      </Dialog>
      
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Detail Data Warga</DialogTitle>
             <DialogDescription>
              Informasi lengkap mengenai data yang Anda entri.
            </DialogDescription>
          </DialogHeader>
          {citizenToView && <CitizenDetailView citizen={citizenToView} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
