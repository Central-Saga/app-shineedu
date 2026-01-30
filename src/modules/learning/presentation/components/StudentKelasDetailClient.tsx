"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { enrollmentRepository } from "@/modules/enrollment/infrastructure/enrollment.repository";
import { sesiApi } from "@/features/sesi/api/sesi.api";
import { assignmentRepository } from "@/modules/learning/infrastructure/assignment.repository";
import type { Enrollment } from "@/modules/enrollment/domain/entities";
import type { Sesi } from "@/features/sesi/types";
import type { Assignment } from "@/modules/learning/domain/entities";
import { 
  Calendar, 
  Clock, 
  CheckCircle2,
  XCircle,
  FileText,
  Upload,
  Eye,
  ArrowLeft,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { SubmitAssignmentDialog } from "./SubmitAssignmentDialog";

interface SesiWithAssignments extends Sesi {
  assignments: Assignment[];
}

interface StudentKelasDetailClientProps {
  params: Promise<{ kelasId: string }>;
}

export function StudentKelasDetailClient({ params }: StudentKelasDetailClientProps) {
  const resolvedParams = use(params);
  const kelasId = Number(resolvedParams.kelasId);
  const router = useRouter();
  const { setItems } = useBreadcrumbStore();
  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [sesiList, setSesiList] = useState<SesiWithAssignments[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Get enrollments for current user
      const enrollmentResult = await enrollmentRepository.getEnrollments({
        status: 'Aktif',
        per_page: 100,
      });

      // Find enrollment that has this kelas
      const enrollmentData = enrollmentResult.data?.find(e => 
        e.kelas?.some(k => k.id === kelasId)
      );

      if (!enrollmentData) {
        toast.error("Anda tidak terdaftar di kelas ini");
        router.push("/student/learning");
        return;
      }

      setEnrollment(enrollmentData);

      // Get sesi for this kelas (only past and today)
      const today = new Date();
      const sesiResult = await sesiApi.getSesiByKelas(kelasId, {
        to: today.toISOString().split('T')[0],
        per_page: 100,
      });

      // Get all assignments for this enrollment
      const assignmentResult = await assignmentRepository.getList({
        enrollment_id: enrollmentData.id,
        per_page: 100,
      });

      const assignments = assignmentResult.data || [];

      // Group assignments by sesi
      const sesiWithAssignments: SesiWithAssignments[] = (sesiResult.data || []).map(sesi => ({
        ...sesi,
        assignments: assignments.filter(a => a.realisasi_jadwal_kerja_id === sesi.id),
      }));

      setSesiList(sesiWithAssignments);

      // Set breadcrumb - find the kelas name
      const kelasInfo = enrollmentData.kelas?.find(k => k.id === kelasId);
      setItems([
        { label: "Dashboard", href: "/dashboard" },
        { label: "Pembelajaran Saya", href: "/student/learning" },
        { label: kelasInfo?.nama_kelas || "Kelas" },
      ]);
    } catch (error) {
      console.error("Failed to fetch kelas detail:", error);
      toast.error("Gagal memuat data kelas");
    } finally {
      setLoading(false);
    }
  }, [kelasId, router, setItems]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getAssignmentStatusBadge = (assignment: Assignment) => {
    switch (assignment.status) {
      case 'ASSIGNED':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
          <Clock className="size-3 mr-1" />
          Belum Dikerjakan
        </Badge>;
      case 'SUBMITTED':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Upload className="size-3 mr-1" />
          Sudah Dikirim
        </Badge>;
      case 'REVIEWED':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle2 className="size-3 mr-1" />
          Sudah Direview
        </Badge>;
      default:
        return <Badge variant="outline">
          {assignment.status}
        </Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <XCircle className="size-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Kelas Tidak Ditemukan</h2>
        <p className="text-muted-foreground mb-4">
          Anda tidak terdaftar di kelas ini
        </p>
        <Button onClick={() => router.push("/student/learning")}>
          <ArrowLeft className="mr-2 size-4" />
          Kembali
        </Button>
      </div>
    );
  }

  const kelasInfo = enrollment.kelas?.find(k => k.id === kelasId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => router.push("/student/learning")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {kelasInfo?.nama_kelas || "Kelas"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {kelasInfo?.program?.nama} • {kelasInfo?.jenjang?.nama}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="text-sm">
          {kelasInfo?.kode_kelas}
        </Badge>
      </div>

      {/* Sesi List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Daftar Pertemuan</h2>
        
        {sesiList.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="size-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Belum ada pertemuan yang tersedia</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sesiList.map((sesi, index) => (
              <Card key={sesi.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Pertemuan #{sesiList.length - index}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        <Calendar className="inline size-3 mr-1" />
                        {formatDate(sesi.tanggal)} • {sesi.jam_mulai_plan} - {sesi.jam_selesai_plan}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={sesi.status_sesi === 'SELESAI' ? 'default' : 'secondary'}
                    >
                      {sesi.status_sesi}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Assignments for this sesi */}
                  {sesi.assignments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <FileText className="size-4" />
                        Tugas ({sesi.assignments.length})
                      </h4>
                      <div className="space-y-2">
                        {sesi.assignments.map((assignment) => (
                          <div 
                            key={assignment.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-sm">{assignment.title}</p>
                              {assignment.due_at && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  <Clock className="inline size-3 mr-1" />
                                  Deadline: {new Date(assignment.due_at).toLocaleDateString("id-ID")}
                                </p>
                              )}
                              {assignment.is_overdue && assignment.status === 'ASSIGNED' && (
                                <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                                  <AlertCircle className="size-3" />
                                  Terlambat
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {getAssignmentStatusBadge(assignment)}
                              {assignment.status === 'ASSIGNED' ? (
                                <Button 
                                  size="sm"
                                  onClick={() => setSelectedAssignment(assignment)}
                                >
                                  <Upload className="size-4 mr-2" />
                                  Kerjakan
                                </Button>
                              ) : (
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedAssignment(assignment)}
                                >
                                  <Eye className="size-4 mr-2" />
                                  Lihat
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No assignments message */}
                  {sesi.assignments.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Tidak ada tugas untuk pertemuan ini
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Submit Assignment Dialog */}
      {selectedAssignment && (
        <SubmitAssignmentDialog
          assignment={selectedAssignment}
          isOpen={!!selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
          onSuccess={() => {
            setSelectedAssignment(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
