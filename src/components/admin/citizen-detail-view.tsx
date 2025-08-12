
'use client';

import { type Citizen } from '@/lib/firestore';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '../ui/textarea';
import Image from 'next/image';
import { ScrollArea } from '../ui/scroll-area';

type CitizenDetailViewProps = {
  citizen: Citizen;
};

export function CitizenDetailView({ citizen }: CitizenDetailViewProps) {
  const hasDocuments = citizen.documents && citizen.documents.length > 0 && citizen.documents[0].startsWith('data:image');
  const documentUri = hasDocuments ? citizen.documents[0] : null;

  return (
    <ScrollArea className="h-[70vh] w-full">
        <div className="space-y-4 py-4 pr-6">
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input id="name" value={citizen.name} readOnly />
            </div>
            <div className="space-y-2">
                <Label htmlFor="nik">NIK</Label>
                <Input id="nik" value={citizen.nik} readOnly />
            </div>
            <div className="space-y-2">
                <Label htmlFor="kkNumber">No. KK</Label>
                <Input id="kkNumber" value={citizen.kkNumber} readOnly />
            </div>
            <div className="space-y-2">
                <Label htmlFor="gender">Jenis Kelamin</Label>
                <Input id="gender" value={citizen.gender} readOnly />
            </div>
            <div className="space-y-2">
                <Label htmlFor="bloodType">Golongan Darah</Label>
                <Input id="bloodType" value={citizen.bloodType} readOnly />
            </div>
        </div>
        <div className="space-y-2">
            <Label htmlFor="address">Alamat</Label>
            <Textarea id="address" value={citizen.address} readOnly />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="rt">RT</Label>
                <Input id="rt" value={citizen.rt} readOnly />
            </div>
            <div className="space-y-2">
                <Label htmlFor="rw">RW</Label>
                <Input id="rw" value={citizen.rw} readOnly />
            </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="contact">No. Telepon</Label>
                <Input id="contact" value={citizen.contactInfo} readOnly />
            </div>
            <div className="space-y-2">
                <Label htmlFor="occupation">Pekerjaan</Label>
                <Input id="occupation" value={citizen.occupation} readOnly />
            </div>
            <div className="space-y-2">
                <Label htmlFor="lastEducation">Pendidikan Terakhir</Label>
                <Input id="lastEducation" value={citizen.lastEducation} readOnly />
            </div>
            <div className="space-y-2">
                <Label htmlFor="religion">Agama</Label>
                <Input id="religion" value={citizen.religion} readOnly />
            </div>
            <div className="space-y-2">
                <Label htmlFor="maritalStatus">Status Perkawinan</Label>
                <Input id="maritalStatus" value={citizen.maritalStatus} readOnly />
            </div>
            <div className="space-y-2">
                <Label htmlFor="familyRelationship">Hubungan Keluarga</Label>
                <Input id="familyRelationship" value={citizen.familyRelationship} readOnly />
            </div>
            <div className="space-y-2">
                <Label htmlFor="familyMembersCount">Jml. Anggota Keluarga</Label>
                <Input id="familyMembersCount" value={citizen.familyMembersCount} readOnly />
            </div>
        </div>
        <div className="space-y-2">
            <Label htmlFor="documents">Dokumen</Label>
            {documentUri ? (
                <div className="space-y-2">
                    <div className="relative aspect-video w-full overflow-hidden rounded-md border">
                        <Image
                            src={documentUri}
                            alt={`Pratinjau Dokumen ${citizen.name}`}
                            data-ai-hint="document scan"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <Input id="documents" value={'Gambar telah diunggah.'} readOnly />
                </div>
            ) : (
                <Input id="documents" value={'Tidak ada dokumen'} readOnly />
            )}

        </div>
        <div className="space-y-2">
            <Label htmlFor="username">Dientri oleh</Label>
            <Input id="username" value={citizen.username} readOnly />
        </div>
        </div>
    </ScrollArea>
  );
}
