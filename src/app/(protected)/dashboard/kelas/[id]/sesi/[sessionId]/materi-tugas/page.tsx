"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Trash2, ExternalLink, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface MateriAssignment {
  materi_id: number;
  materi_title: string;
  assigned_to: {
    enrollment_id: number;
    murid_nama: string;
    accessed_at: string | null;
  }[];
  total_assigned: number;
  total_accessed: number;
}

interface AssignmentAssignment {
  assignment_id: number;
  assignment_title: string;
  assigned_to: {
    enrollment_id: number;
    murid_nama: string;
  }[];
  total_assigned: number;
}

export default function SesiMateriTugasPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const resolvedParams = use(params);
  const kelasId = resolvedParams.id;
  const sessionId = resolvedParams.sessionId;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [materiAssignments, setMateriAssignments] = useState<MateriAssignment[]>([]);
  const [assignmentAssignments, setAssignmentAssignments] = useState<AssignmentAssignment[]>([]);

  useEffect(() => {
    fetchAssignments();
  }, [sessionId]);

  const fetchAssignments = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v2/sesi/${sessionId}/materi-assignments`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
      setMateriAssignments(data.data.materi || []);
      setAssignmentAssignments(data.data.assignments || []);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignMateri = async (materiId: number) => {
    if (!confirm("Hapus semua assignment materi ini?")) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v2/sesi/${sessionId}/materi/${materiId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to unassign");

      toast.success("Materi berhasil di-unassign");
      fetchAssignments();
    } catch (error) {
      console.error(error);
      toast.error("Gagal unassign materi");
    }
  };

  const handleUnassignAssignment = async (assignmentId: number) => {
    if (!confirm("Hapus semua assignment tugas ini?")) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v2/sesi/${sessionId}/assignment/${assignmentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to unassign");

      toast.success("Tugas berhasil di-unassign");
      fetchAssignments();
    } catch (error) {
      console.error(error);
      toast.error("Gagal unassign tugas");
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
      {/* Materi Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Materi yang Di-assign
          </CardTitle>
          <Button
            onClick={() =>
              router.push(`/dashboard/kelas/${kelasId}/sesi/${sessionId}/assign-materi`)
            }
          >
            <Plus className="mr-2 size-4" />
            Assign Materi
          </Button>
        </CardHeader>
        <CardContent>
          {materiAssignments.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              Belum ada materi yang di-assign
            </div>
          ) : (
            <div className="space-y-4">
              {materiAssignments.map((item) => (
                <div
                  key={item.materi_id}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{item.materi_title}</h3>
                      <div className="mt-2 flex items-center gap-4 text-sm">
                        <Badge variant="outline">
                          {item.total_assigned} murid
                        </Badge>
                        <span className="text-slate-600">
                          <CheckCircle className="mr-1 inline size-4 text-green-600" />
                          {item.total_accessed} sudah akses
                        </span>
                        <span className="text-slate-600">
                          <Clock className="mr-1 inline size-4 text-amber-600" />
                          {item.total_assigned - item.total_accessed} belum akses
                        </span>
                      </div>
                      <div className="mt-3">
                        <p className="text-sm font-medium text-slate-700">Assigned to:</p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {item.assigned_to.map((student) => (
                            <Badge
                              key={student.enrollment_id}
                              variant={student.accessed_at ? "default" : "secondary"}
                            >
                              {student.murid_nama}
                              {student.accessed_at && (
                                <CheckCircle className="ml-1 size-3" />
                              )}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleUnassignMateri(item.materi_id)}
                    >
                      <Trash2 className="size-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Tugas yang Diberikan
          </CardTitle>
          <Button
            onClick={() =>
              router.push(`/dashboard/kelas/${kelasId}/sesi/${sessionId}/assign-tugas`)
            }
          >
            <Plus className="mr-2 size-4" />
            Assign Tugas
          </Button>
        </CardHeader>
        <CardContent>
          {assignmentAssignments.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              Belum ada tugas yang di-assign
            </div>
          ) : (
            <div className="space-y-4">
              {assignmentAssignments.map((item) => (
                <div
                  key={item.assignment_id}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{item.assignment_title}</h3>
                      <div className="mt-2 flex items-center gap-4 text-sm">
                        <Badge variant="outline">
                          {item.total_assigned} murid
                        </Badge>
                      </div>
                      <div className="mt-3">
                        <p className="text-sm font-medium text-slate-700">Assigned to:</p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {item.assigned_to.map((student) => (
                            <Badge key={student.enrollment_id} variant="secondary">
                              {student.murid_nama}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleUnassignAssignment(item.assignment_id)}
                    >
                      <Trash2 className="size-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
