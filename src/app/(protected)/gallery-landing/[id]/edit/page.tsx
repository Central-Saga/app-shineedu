"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { LandingGalleryForm } from "@/modules/landing-gallery/presentation/components/LandingGalleryForm";
import { getLandingGalleryItem } from "@/modules/landing-gallery/infrastructure/landing-gallery.repository";
import type { LandingGalleryItem } from "@/modules/landing-gallery/domain/entities";
import { toast } from "sonner";

export default function GalleryLandingEditPage() {
  const params = useParams();
  const router = useRouter();
  const { allowed } = usePermissionGuard("landing.gallery.manage");
  const { setItems } = useBreadcrumbStore();
  const [item, setItem] = useState<LandingGalleryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const id = Number(params?.id);

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Gallery Landing", href: "/gallery-landing" },
      { label: "Edit Item" },
    ]);
  }, [setItems]);

  useEffect(() => {
    if (!allowed || !id || isNaN(id)) return;
    getLandingGalleryItem(id)
      .then(setItem)
      .catch(() => {
        toast.error("Gagal memuat item");
        router.replace("/gallery-landing");
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
    <div className="max-w-2xl">
      <PageHeader
        title="Edit Item Gallery"
        description={`Edit: ${item.title}`}
      />
      <LandingGalleryForm initialData={item} isEdit />
    </div>
  );
}
