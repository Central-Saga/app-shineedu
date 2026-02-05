"use client";

import { useEffect } from "react";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { LandingGalleryForm } from "@/modules/landing-gallery/presentation/components/LandingGalleryForm";

export default function GalleryLandingNewPage() {
  const { allowed } = usePermissionGuard("landing.gallery.manage");
  const { setItems } = useBreadcrumbStore();

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Gallery Landing", href: "/gallery-landing" },
      { label: "Tambah Item" },
    ]);
  }, [setItems]);

  if (!allowed) return null;

  return (
    <div className="w-full">
      <PageHeader
        title="Tambah Item Gallery"
        description="Tambah foto baru ke gallery landing"
      />
      <LandingGalleryForm />
    </div>
  );
}
