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
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { materiRepository } from "@/modules/learning/infrastructure/materi.repository";
import { sesiRepository } from "@/modules/learning/infrastructure/sesi.repository";
import { get } from "@/shared/infrastructure/api/httpClient";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { format } from "date-fns";

interface MateriModul {
  id: number;
  title: string;
  description: string | null;
}

interface Student {
  enrollment_id: number;
  murid_nama: string;
  murid_id: number;
}

interface SesiDetail {
  kelas?: {
    enrollments?: Array<{
      id: number;
      murid_id: number;
      murid?: {
        nama_lengkap: string;
      };
    }>;
  };
  jadwalKerja?: {
    kelas?: {
      nama_kelas?: string;
      enrollments?: Array<{
        id: number;
        murid_id: number;
        murid?: {
          nama_lengkap: string;
        };
      }>;
    };
  };
  absensi?: Array<{
    enrollment_id: number;
    enrollment?: {
      murid_id: number;
      murid?: {
        nama_lengkap: string;
      };
    };
  }>;
  tanggal?: string;
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
  const [materiList, setMateriList] = useState<MateriModul[]>([]);
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
      const [materiData, sesiData] = await Promise.all([
        materiRepository.getList({ per_page: 100 }),
        get<SesiDetail>(`sesi/${sessionId}`),
      ]);

      setMateriList(materiData.data || []);
      
      // Build a unique list of students from both class enrollments and session attendance
      const enrollmentMap = new Map<number, Student>();
      
      // 1. Add from class enrollments
      const classEnrollments = sesiData?.jadwalKerja?.kelas?.enrollments || sesiData?.kelas?.enrollments || [];
      classEnrollments.forEach(e => {
        enrollmentMap.set(e.id, {
          enrollment_id: e.id,
          murid_nama: e.murid?.nama_lengkap || "Unknown",
          murid_id: e.murid_id,
        });
      });

      // 2. Add from session attendance (to capture transfer students)
      const sessionAbsensi = sesiData?.absensi || [];
      sessionAbsensi.forEach(a => {
        if (a.enrollment && !enrollmentMap.has(a.enrollment_id)) {
          enrollmentMap.set(a.enrollment_id, {
            enrollment_id: a.enrollment_id,
            murid_nama: a.enrollment.murid?.nama_lengkap || "Unknown",
            murid_id: a.enrollment.murid_id,
          });
        }
      });

      setStudents(Array.from(enrollmentMap.values()));

      // Set breadcrumbs
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
        description="Pilih materi dan murid yang akan menerima materi"
      />

      <Card>
        <CardHeader>
          <CardTitle>Pilih Materi</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedMateri} onValueChange={setSelectedMateri}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih materi modul..." />
            </SelectTrigger>
            <SelectContent>
              {materiList.map((materi) => (
                <SelectItem key={materi.id} value={materi.id.toString()}>
                  {materi.title}
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
