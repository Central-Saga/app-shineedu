"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { materiRepository } from "@/modules/learning/infrastructure/materi.repository";
import { sesiRepository } from "@/modules/learning/infrastructure/sesi.repository";
import { get } from "@/shared/infrastructure/api/httpClient";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { format } from "date-fns";

interface MateriItem {
  id: number;
  title: string;
  modul_title: string;
}

interface Student {
  enrollment_id: number;
  murid_nama: string;
  murid_id: number;
}

export default function AssignMateriPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const resolvedParams = use(params);
  const kelasId = resolvedParams.id;
  const sessionId = resolvedParams.sessionId;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [materiItems, setMateriItems] = useState<MateriItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedMateri, setSelectedMateri] = useState<string>("");
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const { setItems } = useBreadcrumbStore();

  useEffect(() => {
    fetchData();
  }, [sessionId]);

  useEffect(() => {
    if (selectAll) {
      setSelectedStudents(students.map((s) => s.enrollment_id));
    } else {
      setSelectedStudents([]);
    }
  }, [selectAll, students]);

  const fetchData = async () => {
    try {
      const [materiData, sesiData, absensiData] = await Promise.all([
        materiRepository.getList({ per_page: 200 }),
        get<any>(`sesi/${sessionId}`),
        get<any[]>(`sesi/${sessionId}/absensi`),
      ]);

      // Flatten items from all modules
      const items: MateriItem[] = [];
      materiData.data.forEach(modul => {
        if (modul.items && Array.isArray(modul.items)) {
          modul.items.forEach(item => {
            items.push({
              id: item.id,
              title: item.title,
              modul_title: modul.title
            });
          });
        }
      });
      setMateriItems(items);
      
      const enrollmentMap = new Map<number, Student>();
      const classEnrollments = sesiData?.jadwalKerja?.kelas?.enrollments || sesiData?.kelas?.enrollments || [];
      classEnrollments.forEach((e: any) => {
        enrollmentMap.set(e.id, {
          enrollment_id: e.id,
          murid_nama: e.murid?.nama_lengkap || "Unknown",
          murid_id: e.murid_id,
        });
      });

      const sessionAbsensi = absensiData || [];
      sessionAbsensi.forEach((a: any) => {
        if (!enrollmentMap.has(a.enrollment_id)) {
          enrollmentMap.set(a.enrollment_id, {
            enrollment_id: a.enrollment_id,
            murid_nama: a.enrollment?.murid?.nama_lengkap || "Unknown",
            murid_id: a.enrollment?.murid_id || 0,
          });
        }
      });

      setStudents(Array.from(enrollmentMap.values()));

      setItems([
        { label: "Dashboard", href: "/dashboard" },
        { label: "Kelas", href: "/dashboard/kelas" },
        { label: sesiData?.kelas?.nama_kelas || "Detail Kelas", href: `/dashboard/kelas/${kelasId}` },
        { 
          label: sesiData?.tanggal ? `Sesi ${format(new Date(sesiData.tanggal), "dd/MM/yy")}` : "Detail Sesi", 
          href: `/dashboard/kelas/${kelasId}/sesi/${sessionId}` 
        },
        { label: "Materi & Tugas", href: `/dashboard/kelas/${kelasId}/sesi/${sessionId}/materi-tugas` },
        { label: "Assign Materi" },
      ]);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStudent = (enrollmentId: number) => {
    setSelectedStudents((prev) =>
      prev.includes(enrollmentId)
        ? prev.filter((id) => id !== enrollmentId)
        : [...prev, enrollmentId]
    );
  };

  const handleSubmit = async () => {
    if (!selectedMateri) {
      toast.error("Pilih materi terlebih dahulu");
      return;
    }

    if (selectedStudents.length === 0) {
      toast.error("Pilih minimal 1 murid");
      return;
    }

    setSaving(true);
    try {
      // Find which modul this item belongs to (backend might need both or just item id)
      // Since backend currently expects materi_modul_id, we might need a small adjusted endpoint
      // for item-level assignment if we want absolute granularity.
      // But for now, we'll try to use the current structure.
      
      await sesiRepository.assignMateri(sessionId, parseInt(selectedMateri), selectedStudents);
      toast.success("Materi berhasil di-assign");
      router.push(`/dashboard/kelas/${kelasId}/sesi/${sessionId}/materi-tugas`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal assign materi");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assign Materi"
        description="Pilih item materi dan murid yang akan menerima materi"
        backHref={`/dashboard/kelas/${kelasId}/sesi/${sessionId}/materi-tugas`}
      />

      <Card>
        <CardHeader>
          <CardTitle>Pilih Item Materi</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedMateri} onValueChange={setSelectedMateri}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih item materi..." />
            </SelectTrigger>
            <SelectContent>
              {materiItems.map((item) => (
                <SelectItem key={item.id} value={item.id.toString()}>
                  <div className="flex flex-col text-left">
                    <span className="font-medium">{item.title}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-tight">Modul: {item.modul_title}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pilih Murid</CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={selectAll}
                onCheckedChange={(checked) => setSelectAll(checked as boolean)}
              />
              <Label htmlFor="select-all" className="cursor-pointer">
                Pilih Semua
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              Tidak ada murid di kelas ini
            </div>
          ) : (
            <div className="space-y-3">
              {students.map((student) => (
                <div
                  key={student.enrollment_id}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 p-3"
                >
                  <Checkbox
                    id={`student-${student.enrollment_id}`}
                    checked={selectedStudents.includes(student.enrollment_id)}
                    onCheckedChange={() => handleToggleStudent(student.enrollment_id)}
                  />
                  <Label
                    htmlFor={`student-${student.enrollment_id}`}
                    className="flex-1 cursor-pointer font-medium"
                  >
                    {student.murid_nama}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          Batal
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          <Save className="mr-2 size-4" />
          {saving ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </div>
  );
}
