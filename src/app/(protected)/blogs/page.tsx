"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { DataTablePagination } from "@/shared/presentation/components/table/DataTablePagination";
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
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  listBlogs,
  deleteBlog,
} from "@/modules/blog/infrastructure/blog.repository";
import { BlogTable } from "@/modules/blog/presentation/components/BlogTable";
import type { Blog } from "@/modules/blog/domain/entities";

export default function BlogsPage() {
  const { allowed } = usePermissionGuard("blog.view");
  const router = useRouter();
  const { setItems } = useBreadcrumbStore();

  const [items, setTableItems] = useState<Blog[]>([]);
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
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const canCreate = authStore.hasPermission("blog.manage");
  const canUpdate = authStore.hasPermission("blog.manage");
  const canDelete = authStore.hasPermission("blog.manage");

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Blog" },
    ]);
  }, [setItems]);

  useEffect(() => {
    if (!allowed) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, page, perPage, statusFilter, categoryFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const { items: resItems, meta: resMeta } = await listBlogs({
        page,
        per_page: perPage,
        status: statusFilter ?? undefined,
        category: categoryFilter ?? undefined,
      });
      setTableItems(resItems);
      setMeta(resMeta);
    } catch (e) {
      toast.error("Gagal memuat blog");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(item: Blog) {
    try {
      await deleteBlog(item.id);
      toast.success("Blog dihapus");
      loadData();
    } catch (e) {
      toast.error("Gagal menghapus blog");
    }
  }

  if (!allowed) return null;

  return (
    <div>
      <PageHeader
        title="Blog"
        description="Kelola artikel blog yang ditampilkan di halaman landing"
        actions={
          canCreate && (
            <Button asChild>
              <Link href="/blogs/new">
                <Plus className="mr-2 size-4" />
                Tambah Blog
              </Link>
            </Button>
          )
        }
      />

      <Card className="rounded-2xl shadow-sm mt-6">
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-muted-foreground text-sm whitespace-nowrap">
                Status
              </Label>
              <Select
                value={statusFilter ?? "__all__"}
                onValueChange={(v) => {
                  setStatusFilter(v === "__all__" ? null : v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-[140px]">
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Semua</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-muted-foreground text-sm whitespace-nowrap">
                Kategori
              </Label>
              <Select
                value={categoryFilter ?? "__all__"}
                onValueChange={(v) => {
                  setCategoryFilter(v === "__all__" ? null : v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-[140px]">
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Semua</SelectItem>
                  <SelectItem value="tips">Tips</SelectItem>
                  <SelectItem value="travel">Travel</SelectItem>
                  <SelectItem value="trips">Trips</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
          </div>

          <BlogTable
            items={items}
            loading={loading}
            onEdit={(item) => router.push(`/blogs/${item.id}/edit`)}
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
