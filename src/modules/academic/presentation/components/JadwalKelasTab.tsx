"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { academicApi } from "@/modules/academic/infrastructure/api";
import { JadwalKerjaTable } from "@/modules/jadwal-kerja/presentation/components/JadwalKerjaTable";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid, CalendarDays, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { JadwalKerja } from "@/modules/jadwal-kerja/domain/entities";

import { Kelas } from "../../domain/types";
import { Badge } from "@/components/ui/badge";

interface JadwalKelasTabProps {
  kelasId: number;
  kelas?: Kelas;
}

export function JadwalKelasTab({ kelasId, kelas }: JadwalKelasTabProps) {
  const router = useRouter();
  const [schedules, setSchedules] = useState<JadwalKerja[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await academicApi.getKelasSchedules(kelasId);
      if (res.success && res.data) {
        setSchedules(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch jadwal data", error);
      toast.error("Gagal mengambil data jadwal");
    } finally {
      setLoading(false);
    }
  }, [kelasId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b py-4">
        <div>
            <CardTitle className="text-lg font-bold">Jadwal Kelas</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">Jadwal rutin pertemuan rutin kelas ini</p>
        </div>
        <div className="flex gap-2">
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90">
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Jadwal
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Kelola Jadwal Kelas</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-6 pt-4">
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Mata Pelajaran</p>
                                <p className="font-bold">{kelas?.program?.nama || kelas?.nama_kelas || "-"}</p>
                            </div>
                            <Badge variant="secondary" className="bg-white border">
                                {kelas?.tipe_kelas || "-"}
                            </Badge>
                        </div>

                        <SelectExistingScheduleForm 
                            kelas={kelas!}
                            onSuccess={() => {
                                setOpen(false);
                                fetchData();
                            }}
                            onCancel={() => setOpen(false)}
                        />
                        
                        <div className="pt-6 border-t text-center">
                            <p className="text-sm text-muted-foreground mb-4 italic">
                                Tidak menemukan jadwal yang sesuai?
                            </p>
                            <Button variant="outline" asChild className="w-full border-dashed">
                                <Link href="/jadwal-kerja">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Buat Jadwal Baru di Master Jadwal
                                </Link>
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <JadwalKerjaTable 
            items={schedules}
            loading={loading}
            canUpdate={false} 
            canDelete={false} 
            onView={(item) => router.push(`/jadwal-kerja/${item.id}`)}
            onEdit={() => {}}
            onDelete={() => {}}
        />
      </CardContent>
    </Card>
  );
}

function SelectExistingScheduleForm({ kelas, onSuccess, onCancel }: { kelas: Kelas, onSuccess: () => void, onCancel: () => void }) {
    const [schedules, setSchedules] = useState<JadwalKerja[]>([]);
    const [selectedId, setSelectedId] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState<string>(() => {
        // Use first word of program name as initial search for better matching
        return (kelas.program?.nama || kelas.nama_kelas || "").split(" ")[0];
    });
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const fetchSchedules = useCallback(async (query: string) => {
        setLoading(true);
        try {
            const params = {
                q: query,
                status: 'Aktif',
                per_page: 50 // Show more options
            };
            const res = await academicApi.getAvailableSchedules(params);
            
            // Handle both array and paginated response
            const data = Array.isArray(res.data) ? res.data : (res.data || []);
            setSchedules(data);
        } catch {
            toast.error("Gagal memuat jadwal tersedia");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchSchedules(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, fetchSchedules]);

    const handleSubmit = async () => {
        if (!selectedId) return;
        setSubmitting(true);
        try {
            await academicApi.linkScheduleToKelas(Number(selectedId), kelas.id);
            toast.success("Jadwal berhasil ditautkan");
            onSuccess();
        } catch (e: any) {
             toast.error(e.message || "Gagal menautkan jadwal");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                    <LayoutGrid className="size-4 text-slate-400" />
                    Cari & Pilih Jadwal Kosong
                </label>
                
                <div className="relative">
                    <input 
                        type="text"
                        className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mb-2"
                        placeholder="Ketik mata pelajaran (contoh: Komputer)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {loading && (
                        <div className="absolute right-3 top-2.5">
                            <div className="size-4 border-2 border-primary border-t-transparent animate-spin rounded-full"></div>
                        </div>
                    )}
                </div>

                <Select value={selectedId} onValueChange={setSelectedId}>
                    <SelectTrigger className="h-12">
                        <SelectValue placeholder={loading ? "Mencari jadwal..." : "Pilih jadwal yang tersedia..."} />
                    </SelectTrigger>
                    <SelectContent>
                        {schedules.map((s: any) => (
                            <SelectItem key={s.id} value={String(s.id)} className="py-3">
                                <div className="flex flex-col gap-0.5">
                                    <span className="font-bold">
                                        {s.mata_pelajaran || "Tanpa Mapel"} - {s.hari}
                                    </span>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                         <Clock className="size-3" /> {s.jam_mulai?.slice(0,5)} - {s.jam_selesai?.slice(0,5)} • {s.guru_pengajar?.user?.name || "Belum ada pengajar"}
                                    </span>
                                </div>
                            </SelectItem>
                        ))}
                        {schedules.length === 0 && !loading && (
                            <div className="p-6 text-sm text-muted-foreground text-center bg-slate-50 rounded-md border border-dashed">
                                Tidak ada jadwal kosong yang cocok dengan keyword <span className="font-bold italic">&quot;{searchTerm}&quot;</span>
                            </div>
                        )}
                    </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground italic px-1">
                    *Hanya menampilkan jadwal yang belum memiliki kelas (Orphan).
                </p>
            </div>
            
            <div className="flex gap-3 pt-4">
                 <Button variant="ghost" onClick={onCancel} className="flex-1" type="button">Batal</Button>
                 <Button onClick={handleSubmit} disabled={submitting || !selectedId} className="flex-1 bg-primary hover:bg-primary/90 shadow-md shadow-primary/20">
                    {submitting ? "Menautkan..." : "Simpan Jadwal"}
                 </Button>
            </div>
        </div>
    );
}
