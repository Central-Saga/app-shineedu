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
import { getTemplatesUsecase } from "@/modules/assessment/application/usecases/getTemplates.usecase";
import { TemplateTable } from "@/modules/assessment/presentation/components/TemplateTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { CertificateTemplate } from "@/modules/assessment/domain/entities";

const PER_PAGE_OPTIONS = [10, 20, 50];

export default function TemplatesPage() {
  const { allowed } = usePermissionGuard("assessment.view"); // Assuming general permission
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedQ = useDebouncedValue(search, 400);
  const [filterType, setFilterType] = useState<string | null>(null);

  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [meta, setMeta] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
    from: null as number | null,
    to: null as number | null,
  });
  const [loading, setLoading] = useState(true);

  const prevDebouncedQ = useRef(debouncedQ);
  const { setItems } = useBreadcrumbStore();

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Assessment" },
      { label: "Templates" },
    ]);
  }, [setItems]);

  const canCreate = authStore.hasPermission("assessment.manage"); // Check valid permission

  function buildParams(overridePage?: number) {
    return {
      page: overridePage ?? page,
      per_page: perPage,
      q: debouncedQ || undefined,
      type: filterType === "__all__" ? undefined : filterType || undefined,
      sort_by: "created_at",
      sort_dir: "desc",
    };
  }

  async function loadTemplates(params: any) {
    try {
      setLoading(true);
      const { items, meta: m } = await getTemplatesUsecase(params);
      setTemplates(items);
      setMeta(m);
    } catch (e) {
      toast.error("Gagal memuat template");
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
    const pageToUse = searchJustChanged ? 1 : page;
    const params = buildParams(pageToUse);

    loadTemplates(params);
  }, [allowed, page, perPage, debouncedQ, filterType]);

  if (!allowed) return null;

  return (
    <div>
      <PageHeader
        title="Certificate Templates"
        description="Atur desain sertifikat untuk program kursus"
        actions={
          canCreate && (
            <Button asChild>
              <Link href="/assessment/templates/create">
                <Plus className="mr-2 size-4" />
                Tambah Template
              </Link>
            </Button>
          )
        }
      />

      <Card className="rounded-2xl shadow-sm mt-6">
        <CardContent className="space-y-4 pt-6">
          <DataTableToolbar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Cari template..."
            filters={[
              {
                key: "type",
                label: "Tipe",
                options: [
                  { label: "Semua", value: "__all__" },
                  { label: "English", value: "english" },
                  { label: "Computer", value: "computer" },
                ],
                value: filterType,
                onChange: (v) => {
                  setFilterType(v);
                  setPage(1);
                },
              },
            ]}
          />

          <TemplateTable
            templates={templates}
            loading={loading}
            onView={(t) => router.push(`/assessment/templates/${t.id}`)}
          />

          <DataTablePagination meta={meta} onPageChange={setPage} />
        </CardContent>
      </Card>
    </div>
  );
}
