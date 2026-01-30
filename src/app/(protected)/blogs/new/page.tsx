"use client";

import { useEffect } from "react";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { BlogForm } from "@/modules/blog/presentation/components/BlogForm";

export default function BlogNewPage() {
  const { allowed } = usePermissionGuard("landing.blog.create");
  const { setItems } = useBreadcrumbStore();

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Blog", href: "/blogs" },
      { label: "Tambah Artikel" },
    ]);
  }, [setItems]);

  if (!allowed) return null;

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Tambah Artikel Blog"
        description="Buat artikel blog baru (judul, konten, status, kategori)"
      />
      <BlogForm />
    </div>
  );
}
