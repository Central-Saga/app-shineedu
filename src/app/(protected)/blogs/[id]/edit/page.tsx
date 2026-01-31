"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { BlogForm } from "@/modules/blog/presentation/components/BlogForm";
<<<<<<< HEAD
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
=======
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
>>>>>>> origin/blogss

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Blog", href: "/blogs" },
<<<<<<< HEAD
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
=======
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
>>>>>>> origin/blogss
      })
      .finally(() => setLoading(false));
  }, [allowed, id, router]);

<<<<<<< HEAD
  if (!allowed) return null;
  if (loading || !item) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Memuat...
      </div>
    );
  }
=======
  if (!allowed || loading) return null;
>>>>>>> origin/blogss

  return (
    <div className="max-w-4xl">
      <PageHeader
<<<<<<< HEAD
        title="Edit Blog"
        description={item.title}
      />
      <BlogForm initialData={item} isEdit />
=======
        title="Edit Artikel Blog"
        description="Ubah judul, konten, status, dan kategori"
      />
      {data && <BlogForm initialData={data} isEdit />}
>>>>>>> origin/blogss
    </div>
  );
}
