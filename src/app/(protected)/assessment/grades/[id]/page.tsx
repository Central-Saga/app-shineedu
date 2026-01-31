"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { getGradeUsecase } from "@/modules/assessment/application/usecases/getGrade.usecase";
import { generateCertificateUsecase } from "@/modules/assessment/application/usecases/generateCertificate.usecase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Wand2, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { authStore } from "@/modules/auth/infrastructure/auth.store";
import type { AssessmentGrade } from "@/modules/assessment/domain/entities";

export default function GradeDetailPage() {
  const { allowed } = usePermissionGuard("assessment.view");
  const params = useParams();
  const id = Number(params.id);
  
  const { setItems } = useBreadcrumbStore();
  const [grade, setGrade] = useState<AssessmentGrade | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const canManage = authStore.hasPermission("assessment.manage");

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Grades", href: "/assessment/grades" },
      { label: `Grade #${id}` },
    ]);
  }, [setItems, id]);

  const loadData = useCallback(() => {
    if (!id) return;
    getGradeUsecase(id)
      .then(setGrade)
      .catch(() => toast.error("Gagal memuat grade"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!allowed || !id) return;
    loadData();
  }, [allowed, id, loadData]);

  const handleGenerate = async () => {
    if (!grade) return;
    try {
        setGenerating(true);
        const { data } = await generateCertificateUsecase(grade.id);
        toast.success("Certificate generated!");
        // Reload to get updated url/status
        loadData();
        // Optional: Open PDF immediately
        if (data.url) {
            window.open(data.url, "_blank");
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to generate";
        toast.error(message);
        setGenerating(false);
    }
  };

  if (!allowed) return null;

  if (loading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-64 w-full" />
        </div>
    );
  }

  if (!grade) return <div>Data tidak ditemukan</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title={`Penilaian: ${grade.enrollment?.student?.nama_lengkap || "Unknown"}`}
        description={`Program: ${grade.enrollment?.program?.nama || "-"}`}
        backHref="/assessment/grades"
        actions={
            <div className="flex gap-2">
                {grade.certificate_no ? (
                      <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <a 
                              href={`${process.env.NEXT_PUBLIC_API_BASE_URL}/public/certificates/${grade.certificate_no}/download`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                                <Download className="mr-2 size-4" /> Download PDF
                            </a>
                        </Button>
                        {canManage && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={handleGenerate} 
                            disabled={generating}
                            title="Regenerate Certificate"
                          >
                             <Wand2 className={`size-4 ${generating ? "animate-spin" : ""}`} />
                          </Button>
                        )}
                      </div>
                ) : (
                    canManage && (
                        <Button onClick={handleGenerate} disabled={generating}>
                            <Wand2 className="mr-2 size-4" />
                            {generating ? "Generating..." : "Generate Certificate"}
                        </Button>
                    )
                )}
            </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Rincian Nilai</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        {Object.entries(grade.scores || {}).map(([key, val]) => (
                            <div key={key} className="p-4 bg-slate-50 rounded-lg flex flex-col">
                                <span className="text-sm capitalize text-muted-foreground">{key}</span>
                                <span className="text-2xl font-semibold">{val}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                     <CardTitle>Certificate Preview</CardTitle>
                </CardHeader>
                <CardContent>
                    {grade.generated_at ? (
                        <div className="flex flex-col items-center justify-center p-8 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-800">
                             <span className="font-semibold text-lg">Certificate Generated</span>
                             <span className="text-sm">No: {grade.certificate_no}</span>
                             <span className="text-xs text-emerald-600 mt-1">Generated: {grade.generated_at}</span>
                        </div>
                    ) : (
                        <div className="text-center p-8 text-muted-foreground bg-slate-50 rounded-lg border border-dashed">
                            Certificate belum digenerate.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b">
                        <span className="text-sm text-muted-foreground">Type</span>
                        <Badge variant="secondary" className="capitalize">{grade.certificate_template?.type}</Badge>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b">
                        <span className="text-sm text-muted-foreground">Total Score</span>
                        <span className="font-mono">{grade.total_score}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b">
                        <span className="text-sm text-muted-foreground">Average</span>
                        <span className="font-mono font-bold">{grade.average_score}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                        <span className="text-sm text-muted-foreground">Predicate</span>
                        <span className="text-xl font-bold text-blue-600">{grade.predicate}</span>
                    </div>
                    {grade.certificate_level && (
                         <div className="flex justify-between items-center pt-2">
                            <span className="text-sm text-muted-foreground">Level</span>
                            <span className="font-medium">{grade.certificate_level}</span>
                        </div>
                    )}
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Template Used</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <span className="block font-medium">{grade.certificate_template?.name}</span>
                        {grade.certificate_template?.cover_image && (
                            <div className="relative w-full aspect-video rounded overflow-hidden border">
                                <Image 
                                    src={grade.certificate_template.cover_image}
                                    alt="Template"
                                    fill
                                    unoptimized
                                    className="object-cover"
                                />
                            </div>
                        )}
                        <Button variant="link" size="sm" className="px-0" asChild>
                            <Link href={`/assessment/templates/${grade.certificate_template_id}`}>
                                View Template <ExternalLink className="ml-1 size-3"/>
                            </Link>
                        </Button>
                    </div>
                </CardContent>
             </Card>
        </div>
      </div>
    </div>
  );
}
