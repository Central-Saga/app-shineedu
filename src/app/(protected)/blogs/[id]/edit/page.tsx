"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { BlogForm } from "@/modules/blog/presentation/components/BlogForm";
import { getBlog } from "@/modules/blog/infrastructure/blog.repository";
import type { Blog } from "@/modules/blog/domain/entities";
import { toast } from "sonner";

export default function BlogEditPage() {
  const params = useParams();
  const router = useRouter();
  const { allowed } = usePermissionGuard("blog.manage");
  const { setItems } = useBreadcrumbStore();
  const [item, setItem] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const id = Number(params?.id);

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Blog", href: "/blogs" },
      { label: "Edit Blog" },
    ]);
  }, [setItems]);

  useEffect(() => {
    if (!allowed || !id || isNaN(id)) return;
    getBlog(id)
      .then(setItem)
      .catch(() => {
        toast.error("Gagal memuat blog");
        router.replace("/blogs");
      })
      .finally(() => setLoading(false));
  }, [allowed, id, router]);

  if (!allowed) return null;
  if (loading || !item) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Memuat...
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Edit Blog"
        description={item.title}
      />
      <BlogForm initialData={item} isEdit />
    </div>
  );
}
