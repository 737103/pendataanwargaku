
'use client';

import { useState, useEffect } from 'react';
import { getUsers, type User, deleteUser } from '@/lib/firestore';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EditUserForm } from './edit-user-form';

export function UserDataClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const userList = await getUsers();
      setUsers(userList);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast({
        title: 'Gagal Mengambil Data',
        description: 'Tidak dapat mengambil daftar pengguna.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    setCurrentUsername(localStorage.getItem('username'));
  }, []);

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleEditClick = (user: User) => {
    setUserToEdit(user);
    setIsEditDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser(userToDelete.id);
      toast({
        title: 'Pengguna Dihapus',
        description: `Pengguna "${userToDelete.name}" telah berhasil dihapus.`,
      });
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast({
        title: 'Gagal Menghapus',
        description: 'Terjadi kesalahan saat menghapus pengguna.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const onUpdateSuccess = () => {
    setIsEditDialogOpen(false);
    setUserToEdit(null);
    fetchUsers();
  }


  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengguna</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>NIK</TableHead>
                <TableHead>No. Telepon</TableHead>
                <TableHead>Alamat</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
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
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-36" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                         <Skeleton className="h-8 w-8" />
                         <Skeleton className="h-8 w-8" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.nik}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>{user.address}</TableCell>
                    <TableCell>
                      <Badge
                        variant={user.status === 'active' ? 'default' : 'destructive'}
                        className={user.status === 'active' ? 'bg-green-500' : ''}
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" size="icon" onClick={() => handleEditClick(user)}>
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="icon" 
                              onClick={() => handleDeleteClick(user)}
                              disabled={user.username === currentUsername}
                              title={user.username === currentUsername ? "Tidak dapat menghapus diri sendiri" : "Hapus pengguna"}
                            >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Hapus</span>
                            </Button>
                        </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Tidak ada data pengguna.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat diurungkan. Ini akan menghapus pengguna
              "{userToDelete?.name}" secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit User Dialog */}
       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Pengguna</DialogTitle>
            <DialogDescription>
              Lakukan perubahan pada data pengguna. Klik simpan jika sudah selesai.
            </DialogDescription>
          </DialogHeader>
          {userToEdit && <EditUserForm user={userToEdit} onSuccess={onUpdateSuccess} isEditingSelf={userToEdit.username === currentUsername} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
