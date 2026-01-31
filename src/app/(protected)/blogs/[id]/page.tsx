"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getBlogPostDetail } from "@/modules/blog/infrastructure/blog.repository";
import type { BlogPost } from "@/modules/blog/domain/entities";
import { NotFoundError } from "@/shared/infrastructure/api/errors";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ArrowLeft, User, Tag, Calendar, Pencil } from "lucide-react";
import { authStore } from "@/modules/auth/infrastructure/auth.store";

export default function BlogDetailPage() {
  const { allowed } = usePermissionGuard("landing.blog.view");
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [data, setData] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const { setItems } = useBreadcrumbStore();

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Blog", href: "/blogs" },
      { label: "Detail Artikel" },
    ]);
  }, [setItems]);

  const fetchData = useCallback(async () => {
    try {
      const res = await getBlogPostDetail(id);
      setData(res);
    } catch (e) {
      if (e instanceof NotFoundError) {
        toast.error("Artikel tidak ditemukan");
        router.replace("/blogs");
      } else {
        toast.error("Gagal memuat data artikel");
      }
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (!allowed || !id || Number.isNaN(id)) return;
    fetchData();
  }, [allowed, id, fetchData]);

  if (!allowed) return null;

  if (loading && !data) {
    return (
      <div className="w-full animate-pulse space-y-6">
        <div className="mb-8 flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (!data) return null;

  const canUpdate = authStore.hasPermission("landing.blog.update");

  return (
    <div className="w-full space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="h-9 w-9"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight">{data.title}</h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge
                variant={data.status === "published" ? "default" : "secondary"}
                className={data.status === "published" ? "bg-emerald-600" : ""}
              >
                {data.status === "published" ? "Published" : "Draft"}
              </Badge>
              {data.category && (
                <Badge variant="outline">{data.category}</Badge>
              )}
            </div>
          </div>
        </div>
        {canUpdate && (
          <Button
            variant="default"
            size="sm"
            onClick={() => router.push(`/blogs/${id}/edit`)}
          >
            <Pencil className="mr-2 size-4" /> Edit
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
        {data.author && (
          <span className="flex items-center gap-1">
            <User className="size-4" /> {data.author.name}
          </span>
        )}
        {data.category && (
          <span className="flex items-center gap-1">
            <Tag className="size-4" /> {data.category}
          </span>
        )}
        {data.created_at && (
          <span className="flex items-center gap-1">
            <Calendar className="size-4" />{" "}
            {format(new Date(data.created_at), "dd MMMM yyyy", { locale: idLocale })}
          </span>
        )}
      </div>

      {data.featured_image_url && (
        <div className="relative h-64 w-full overflow-hidden rounded-lg border bg-muted sm:h-80">
          <Image
            src={data.featured_image_url}
            alt={data.title}
            fill
            className="object-cover"
            unoptimized
            sizes="(max-width: 640px) 100vw, 800px"
          />
        </div>
      )}

      {data.content && (
        <Card>
          <CardHeader className="border-b py-4">
            <CardTitle className="text-base text-primary">Konten</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div
              className="prose prose-sm max-w-none text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: data.content }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
