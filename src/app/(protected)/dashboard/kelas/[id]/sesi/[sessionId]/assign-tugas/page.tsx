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

interface Assignment {
  id: number;
  title: string;
  description: string | null;
  due_date: string | null;
}

interface Student {
  enrollment_id: number;
  murid_nama: string;
  murid_id: number;
}

export default function AssignTugasPage({
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
  const [assignmentList, setAssignmentList] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<string>("");
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

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
      const [assignmentRes, sesiRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/v2/assignments?per_page=100`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/v2/sesi/${sessionId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }),
      ]);

      if (!assignmentRes.ok || !sesiRes.ok) throw new Error("Failed to fetch");

      const assignmentData = await assignmentRes.json();
      const sesiData = await sesiRes.json();

      setAssignmentList(assignmentData.data || []);
      
      // Get students from kelas enrollments
      const enrollments = sesiData.data?.kelas?.enrollments || [];
      setStudents(
        enrollments.map((e: any) => ({
          enrollment_id: e.id,
          murid_nama: e.murid?.nama_lengkap || "Unknown",
          murid_id: e.murid_id,
        }))
      );
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
    if (!selectedAssignment) {
      toast.error("Pilih tugas terlebih dahulu");
      return;
    }

    if (selectedStudents.length === 0) {
      toast.error("Pilih minimal 1 murid");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v2/sesi/${sessionId}/assign-assignment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            assignment_id: parseInt(selectedAssignment),
            enrollment_ids: selectedStudents,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to assign");

      toast.success("Tugas berhasil di-assign");
      router.push(`/dashboard/kelas/${kelasId}/sesi/${sessionId}/materi-tugas`);
    } catch (error) {
      console.error(error);
      toast.error("Gagal assign tugas");
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
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assign Tugas</h1>
          <p className="text-sm text-slate-600">
            Pilih tugas dan murid yang akan menerima tugas
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pilih Tugas</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedAssignment} onValueChange={setSelectedAssignment}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih tugas..." />
            </SelectTrigger>
            <SelectContent>
              {assignmentList.map((assignment) => (
                <SelectItem key={assignment.id} value={assignment.id.toString()}>
                  <div>
                    <div>{assignment.title}</div>
                    {assignment.due_date && (
                      <div className="text-xs text-slate-500">
                        Deadline: {new Date(assignment.due_date).toLocaleDateString('id-ID')}
                      </div>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/tugas/create')}
              className="w-full"
            >
              + Buat Tugas Baru
            </Button>
          </div>
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
