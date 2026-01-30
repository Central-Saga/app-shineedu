"use client";

import { useEffect, useState, useCallback } from "react";
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
  AlertCircle,
  ChevronRight,
  GraduationCap,
  FileText
} from "lucide-react";
import { toast } from "sonner";

interface KelasWithSesi {
  kelas_id: number;
  kelas_nama: string;
  kelas_kode: string;
  program_nama?: string;
  jenjang_nama?: string;
  enrollment: Enrollment;
  sesi: Sesi[];
  assignments: Assignment[];
}

export function StudentLearningClient() {
  const router = useRouter();
  const { setItems } = useBreadcrumbStore();
  const [loading, setLoading] = useState(true);
  const [kelasData, setKelasData] = useState<KelasWithSesi[]>([]);

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Pembelajaran Saya" },
    ]);
  }, [setItems]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Get all enrollments for current logged-in user (student)
      // The API will automatically filter by current user
      const enrollmentResult = await enrollmentRepository.getEnrollments({
        status: 'Aktif',
        per_page: 100,
      });

      const enrollments = enrollmentResult.data || [];
      
      // For each enrollment, get the kelas and its sesi
      const kelasDataPromises = enrollments.flatMap((enrollment) => {
        // Enrollment.kelas is an array, so we need to process each kelas
        const kelasList = enrollment.kelas || [];
        
        return kelasList.map(async (kelas) => {
          try {
            // Get sesi for this kelas (only past and today's sesi)
            const today = new Date();
            const sesiResult = await sesiApi.getSesiByKelas(kelas.id, {
              to: today.toISOString().split('T')[0],
              per_page: 100,
            });

            // Get assignments for this enrollment
            const assignmentResult = await assignmentRepository.getList({
              enrollment_id: enrollment.id,
              per_page: 100,
            });

            return {
              kelas_id: kelas.id,
              kelas_nama: kelas.nama_kelas || "Unknown",
              kelas_kode: kelas.kode_kelas || "",
              program_nama: kelas.program?.nama,
              jenjang_nama: kelas.jenjang?.nama,
              enrollment,
              sesi: sesiResult.data || [],
              assignments: assignmentResult.data || [],
            };
          } catch (error) {
            console.error(`Failed to fetch data for kelas ${kelas.id}:`, error);
            return null;
          }
        });
      });

      const results = await Promise.all(kelasDataPromises);
      setKelasData(results.filter((r): r is KelasWithSesi => r !== null));
    } catch (error) {
      console.error("Failed to fetch student learning data:", error);
      toast.error("Gagal memuat data pembelajaran");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getSesiStats = (sesi: Sesi[], assignments: Assignment[]) => {
    const totalSesi = sesi.length;
    const completedSesi = sesi.filter(s => s.status_sesi === 'SELESAI').length;
    
    const totalAssignments = assignments.length;
    const submittedAssignments = assignments.filter(a => 
      a.status === 'SUBMITTED' || a.status === 'REVIEWED'
    ).length;

    return { totalSesi, completedSesi, totalAssignments, submittedAssignments };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (kelasData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="size-20 bg-muted rounded-full flex items-center justify-center text-muted-foreground mb-4">
          <GraduationCap className="size-10" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Belum Ada Kelas</h2>
        <p className="text-muted-foreground max-w-md">
          Anda belum terdaftar di kelas manapun. Silakan hubungi admin untuk mendaftar ke kelas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pembelajaran Saya</h1>
        <p className="text-muted-foreground mt-2">
          Lihat materi dan tugas dari semua kelas yang Anda ikuti
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kelasData.map((kelas) => {
          const stats = getSesiStats(kelas.sesi, kelas.assignments);
          const progressPercentage = stats.totalSesi > 0 
            ? Math.round((stats.completedSesi / stats.totalSesi) * 100)
            : 0;

          return (
            <Card key={kelas.kelas_id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{kelas.kelas_nama}</CardTitle>
                    <CardDescription className="text-xs">
                      {kelas.kelas_kode}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {kelas.program_nama || "Program"}
                  </Badge>
                </div>
                {kelas.jenjang_nama && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {kelas.jenjang_nama}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-muted-foreground">Progress Sesi</span>
                    <span className="font-semibold">{progressPercentage}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <Calendar className="size-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Sesi</p>
                      <p className="text-sm font-semibold">
                        {stats.completedSesi}/{stats.totalSesi}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <FileText className="size-4 text-orange-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Tugas</p>
                      <p className="text-sm font-semibold">
                        {stats.submittedAssignments}/{stats.totalAssignments}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pending Assignments Alert */}
                {stats.totalAssignments > stats.submittedAssignments && (
                  <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <AlertCircle className="size-4 text-orange-600" />
                    <p className="text-xs text-orange-800">
                      {stats.totalAssignments - stats.submittedAssignments} tugas belum dikerjakan
                    </p>
                  </div>
                )}

                <Button 
                  className="w-full" 
                  onClick={() => router.push(`/student/learning/${kelas.kelas_id}`)}
                >
                  Lihat Detail
                  <ChevronRight className="ml-2 size-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
