"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { DataTableToolbar } from "@/shared/presentation/components/table/DataTableToolbar";
import { DataTablePagination } from "@/shared/presentation/components/table/DataTablePagination";
import { useDebouncedValue } from "@/shared/presentation/hooks/useDebouncedValue";
import { authStore } from "@/modules/auth/infrastructure/auth.store";
import { StatsCard } from "@/shared/presentation/components/StatsCard";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, FileText, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  listBlogPosts,
  deleteBlogPost,
} from "@/modules/blog/infrastructure/blog.repository";
import { BlogTable } from "@/modules/blog/presentation/components/BlogTable";
import type { BlogPost } from "@/modules/blog/domain/entities";

const STATUS_OPTIONS = [
  { label: "Semua", value: "__all__" },
  { label: "Published", value: "published" },
  { label: "Draft", value: "draft" },
];

const SORT_OPTIONS = [
  { label: "Tanggal", value: "created_at" },
  { label: "Judul", value: "title" },
  { label: "Kategori", value: "category" },
] as const;

export default function BlogsPage() {
  const { allowed } = usePermissionGuard("landing.blog.view");
  const router = useRouter();
  const { setItems } = useBreadcrumbStore();

  const [items, setTableItems] = useState<BlogPost[]>([]);
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
  const [search, setSearch] = useState("");
  const debouncedQ = useDebouncedValue(search, 400);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<string>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
  });

  const canCreate = authStore.hasPermission("landing.blog.create");
  const canUpdate = authStore.hasPermission("landing.blog.update");
  const canDelete = authStore.hasPermission("landing.blog.delete");

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
  }, [allowed, page, perPage, debouncedQ, statusFilter, sortKey, sortDir]);

  async function loadData() {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: perPage,
        q: debouncedQ || undefined,
        status: statusFilter === "__all__" || statusFilter === null ? undefined : statusFilter,
        sort_by: sortKey,
        sort_dir: sortDir,
      };
      const { items: resItems, meta: resMeta } = await listBlogPosts(params);
      setTableItems(resItems);
      setMeta(resMeta);

      const [totalRes, publishedRes, draftRes] = await Promise.all([
        listBlogPosts({ per_page: 1 }),
        listBlogPosts({ per_page: 1, status: "published" }),
        listBlogPosts({ per_page: 1, status: "draft" }),
      ]);
      setStats({
        total: totalRes.meta.total,
        published: publishedRes.meta.total,
        draft: draftRes.meta.total,
      });
    } catch (e) {
      toast.error("Gagal memuat data blog");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(item: BlogPost) {
    try {
      await deleteBlogPost(item.id);
      toast.success("Artikel blog dihapus");
      loadData();
    } catch (e) {
      toast.error("Gagal menghapus artikel");
    }
  }

  if (!allowed) return null;

  return (
    <div>
      <PageHeader
        title="Blog"
        description="Kelola artikel blog untuk halaman blog landing"
        actions={
          canCreate ? (
            <Button asChild>
              <Link href="/blogs/new">
                <Plus className="mr-2 size-4" /> Tambah Artikel
              </Link>
            </Button>
          ) : undefined
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard
          label="Total"
          value={stats.total}
          icon={FileText}
          variant="primary"
          description="Semua artikel"
        />
        <StatsCard
          label="Published"
          value={stats.published}
          icon={CheckCircle}
          variant="success"
          description="Artikel terpublikasi"
        />
        <StatsCard
          label="Draft"
          value={stats.draft}
          icon={XCircle}
          variant="danger"
          description="Artikel draft"
        />
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="space-y-4 pt-6">
          <DataTableToolbar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Cari judul, konten..."
            filters={[
              {
                key: "status",
                label: "Status",
                options: STATUS_OPTIONS,
                value: statusFilter,
                onChange: (v) => {
                  setStatusFilter(v);
                  setPage(1);
                },
              },
            ]}
            sort={{
              value: sortKey,
              options: [...SORT_OPTIONS],
              onChange: (v) => setSortKey(v),
              direction: sortDir,
              onToggleDirection: () =>
                setSortDir((d) => (d === "asc" ? "desc" : "asc")),
              defaultValue: "created_at",
              defaultDirection: "desc",
              onDirectionChange: setSortDir,
            }}
          />

          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground whitespace-nowrap text-sm">
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
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <BlogTable
            items={items}
            loading={loading}
            onView={(item) => router.push(`/blogs/${item.id}`)}
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
