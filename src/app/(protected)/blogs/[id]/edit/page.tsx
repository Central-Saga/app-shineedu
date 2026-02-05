"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { BlogForm } from "@/modules/blog/presentation/components/BlogForm";
import { getBlogPostDetail } from "@/modules/blog/infrastructure/blog.repository";
import type { BlogPost } from "@/modules/blog/domain/entities";
import { toast } from "sonner";

export default function BlogEditPage() {
  const { allowed } = usePermissionGuard("landing.blog.update");
  const { setItems } = useBreadcrumbStore();
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const id = Number(params.id);

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Blog", href: "/blogs" },
      { label: "Detail", href: `/blogs/${id}` },
      { label: "Edit" },
    ]);
  }, [setItems, id]);

  useEffect(() => {
    if (!allowed) return;
    if (!id || Number.isNaN(id)) return;
    getBlogPostDetail(id)
      .then(setData)
      .catch(() => {
        toast.error("Gagal memuat data artikel");
        router.push("/blogs");
      })
      .finally(() => setLoading(false));
  }, [allowed, id, router]);

  if (!allowed || loading) return null;

  return (
    <div className="w-full">
      <PageHeader
        title="Edit Artikel Blog"
        description="Ubah judul, konten, status, dan kategori"
      />
      {data && <BlogForm initialData={data} isEdit />}
    </div>
  );
}
