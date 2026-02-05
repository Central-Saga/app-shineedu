"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { DataTablePagination } from "@/shared/presentation/components/table/DataTablePagination";
import { StatsCard } from "@/shared/presentation/components/StatsCard";
import { authStore } from "@/modules/auth/infrastructure/auth.store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Image as ImageIcon, Plus, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  listLandingGallery,
  deleteLandingGalleryItem,
} from "@/modules/landing-gallery/infrastructure/landing-gallery.repository";
import { LandingGalleryTable } from "@/modules/landing-gallery/presentation/components/LandingGalleryTable";
import type { LandingGalleryItem } from "@/modules/landing-gallery/domain/entities";

export default function GalleryLandingPage() {
  const { allowed } = usePermissionGuard("landing.gallery.view");
  const router = useRouter();
  const { setItems } = useBreadcrumbStore();

  const [items, setTableItems] = useState<LandingGalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({
    current_page: 1,
    per_page: 15,
    total: 0,
    last_page: 1,
    from: null as number | null,
    to: null as number | null,
  });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);

  const canCreate = authStore.hasPermission("landing.gallery.manage");
  const canUpdate = authStore.hasPermission("landing.gallery.manage");
  const canDelete = authStore.hasPermission("landing.gallery.manage");

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Gallery Landing" },
    ]);
  }, [setItems]);

  useEffect(() => {
    if (!allowed) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, page, perPage]);

  async function loadData() {
    setLoading(true);
    try {
      const { items: resItems, meta: resMeta } = await listLandingGallery({
        page,
        per_page: perPage,
      });
      setTableItems(resItems);
      setMeta(resMeta);
    } catch (e) {
      toast.error("Gagal memuat gallery");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(item: LandingGalleryItem) {
    try {
      await deleteLandingGalleryItem(item.id);
      toast.success("Item gallery dihapus");
      loadData();
    } catch (e) {
      toast.error("Gagal menghapus item");
    }
  }

  if (!allowed) return null;

  const activeCount = items.filter((item) => item.is_active).length;
  const inactiveCount = items.filter((item) => !item.is_active).length;

  return (
    <div>
      <PageHeader
        title="Gallery Landing"
        description="Kelola foto yang ditampilkan di halaman gallery landing"
        actions={
          canCreate && (
            <Button asChild>
              <Link href="/gallery-landing/new">
                <Plus className="mr-2 size-4" />
                Tambah Item
              </Link>
            </Button>
          )
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          label="Total Item"
          value={meta.total}
          icon={ImageIcon}
          variant="primary"
          description="Seluruh item gallery"
        />
        <StatsCard
          label="Aktif"
          value={activeCount}
          icon={CheckCircle2}
          variant="success"
          description="Di halaman ini"
        />
        <StatsCard
          label="Nonaktif"
          value={inactiveCount}
          icon={XCircle}
          variant="danger"
          description="Di halaman ini"
        />
      </div>

      <Card className="rounded-2xl shadow-sm mt-6">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground text-sm whitespace-nowrap">
              Per halaman
            </Label>
            <Select
              value={String(perPage)}
              onValueChange={(v) => {
                setPerPage(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="30">30</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <LandingGalleryTable
            items={items}
            loading={loading}
            onEdit={(item) => router.push(`/gallery-landing/${item.id}/edit`)}
            onDelete={handleDelete}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />

          <DataTablePagination meta={meta} onPageChange={setPage} />
        </CardContent>
      </Card>
    </div>
  );
}
