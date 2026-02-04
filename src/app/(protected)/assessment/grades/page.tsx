"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { DataTableToolbar } from "@/shared/presentation/components/table/DataTableToolbar";
import { DataTablePagination } from "@/shared/presentation/components/table/DataTablePagination";
import { useDebouncedValue } from "@/shared/presentation/hooks/useDebouncedValue";
import { authStore } from "@/modules/auth/infrastructure/auth.store";
import { getGradesUsecase } from "@/modules/assessment/application/usecases/getGrades.usecase";
import { generateCertificateUsecase } from "@/modules/assessment/application/usecases/generateCertificate.usecase";
import { GradeTable } from "@/modules/assessment/presentation/components/GradeTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { AssessmentGrade } from "@/modules/assessment/domain/entities";
import { ExportDropdown } from "@/shared/presentation/components/ExportDropdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { assessmentRepository } from "@/modules/assessment/infrastructure/assessment.repository";

export default function GradesPage() {
  const { allowed } = usePermissionGuard("assessment.view");
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [courseType, setCourseType] = useState<string>("computer");
  const debouncedQ = useDebouncedValue(search, 400);

  const [grades, setGrades] = useState<AssessmentGrade[]>([]);
  const [meta, setMeta] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
    from: null as number | null,
    to: null as number | null,
  });
  const [loading, setLoading] = useState(true);

  const { setItems } = useBreadcrumbStore();
  const prevDebouncedQ = useRef(debouncedQ);

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Assessment" },
      { label: "Grades" },
    ]);
  }, [setItems]);

  const canManage = authStore.hasPermission("assessment.manage");

  function buildParams(overridePage?: number) {
    return {
      page: overridePage ?? page,
      per_page: perPage,
      q: debouncedQ || undefined,
      sort_by: "created_at",
      sort_dir: "desc",
      type: courseType,
    };
  }

  async function loadGrades(params: any) {
    try {
      setLoading(true);
      const { items, meta: m } = await getGradesUsecase(params);
      setGrades(items);
      setMeta(m);
    } catch (e) {
      toast.error("Gagal memuat grades");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!allowed) return;
    const searchJustChanged = prevDebouncedQ.current !== debouncedQ;
    if (searchJustChanged) {
      prevDebouncedQ.current = debouncedQ;
      setPage(1);
    }
    loadGrades(buildParams(searchJustChanged ? 1 : page));
  }, [allowed, page, perPage, debouncedQ, courseType]);

  const handleGenerate = async (g: AssessmentGrade) => {
    if (!confirm("Generate sertifikat untuk siswa ini?")) return;
    try {
        await generateCertificateUsecase(g.id);
        toast.success("Certificate generated successfully");
        loadGrades(buildParams());
    } catch (e: any) {
        toast.error(e.message || "Failed to generate");
    }
  };

  const handleExport = async (format: string) => {
    const params = buildParams();
    // No pagination for export usually, or just pass current filters
    const exportParams = {
        ...params,
        export: format,
        per_page: -1 // All
    };
    await assessmentRepository.exportGrades(exportParams);
  };

  if (!allowed) return null;

  return (
    <div>
      <PageHeader
        title="Assessment Grades"
        description="Data nilai dan sertifikat siswa"
        actions={

          <div className="flex gap-2">
            <ExportDropdown onExport={handleExport} />
            {canManage && (
                <Button asChild>
                <Link href="/assessment/grades/create">
                    <Plus className="mr-2 size-4" />
                    Input Nilai
                </Link>
                </Button>
            )}
          </div>
        }
      />

      <Tabs 
        defaultValue="computer" 
        className="mt-6" 
        value={courseType} 
        onValueChange={(v) => {
            setCourseType(v);
            setPage(1);
        }}
      >
        <TabsList>
            <TabsTrigger value="computer">Komputer</TabsTrigger>
            <TabsTrigger value="english">English</TabsTrigger>
        </TabsList>
       
        <TabsContent value="computer" className="mt-4">
            <GradeTableContent 
                search={search}
                setSearch={setSearch}
                grades={grades}
                loading={loading}
                meta={meta}
                setPage={setPage}
                router={router}
                canManage={canManage}
                handleGenerate={handleGenerate}
            />
        </TabsContent>
        <TabsContent value="english" className="mt-4">
            <GradeTableContent 
                search={search}
                setSearch={setSearch}
                grades={grades}
                loading={loading}
                meta={meta}
                setPage={setPage}
                router={router}
                canManage={canManage}
                handleGenerate={handleGenerate}
            />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GradeTableContent({ 
    search, 
    setSearch, 
    grades, 
    loading, 
    meta, 
    setPage, 
    router, 
    canManage, 
    handleGenerate 
}: any) {
    return (
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="space-y-4 pt-6">
          <DataTableToolbar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Cari siswa/certificate..."
            filters={[]}
            sort={{
              value: "created_at",
              options: [{ label: "Dibuat", value: "created_at" }],
              onChange: () => {}, 
              direction: "desc",
              onToggleDirection: () => {}, 
            }}
          />

          <GradeTable
            grades={grades}
            loading={loading}
            onView={(g) => router.push(`/assessment/grades/${g.id}`)}
            onGenerate={canManage ? handleGenerate : undefined}
          />

          <DataTablePagination meta={meta} onPageChange={setPage} />
        </CardContent>
      </Card>
    );
}
