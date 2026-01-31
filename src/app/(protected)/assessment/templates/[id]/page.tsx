"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { getTemplateUsecase } from "@/modules/assessment/application/usecases/getTemplate.usecase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { CertificateTemplate } from "@/modules/assessment/domain/entities";

export default function TemplateDetailPage() {
  const { allowed } = usePermissionGuard("assessment.view");
  const params = useParams();
  const id = Number(params.id);
  
  const { setItems } = useBreadcrumbStore();
  const [template, setTemplate] = useState<CertificateTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Templates", href: "/assessment/templates" },
      { label: `Template #${id}` },
    ]);
  }, [setItems, id]);

  useEffect(() => {
    if (!allowed || !id) return;
    setLoading(true);
    getTemplateUsecase(id)
      .then(setTemplate)
      .catch((e) => toast.error("Gagal memuat detail template"))
      .finally(() => setLoading(false));
  }, [allowed, id]);

  if (!allowed) return null;

  if (loading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-64 w-full" />
        </div>
    );
  }

  if (!template) return <div>Template tidak ditemukan</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={template.name}
        description={`Template tipe ${template.type}`}
        showBackButton
        actions={
            <Badge variant="outline" className="text-lg px-3 py-1 capitalize">
                {template.type}
            </Badge>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Data Mapping</CardTitle>
            </CardHeader>
            <CardContent>
                <pre className="text-xs bg-slate-50 p-4 rounded-md overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(template.data_mapping, null, 2)}
                </pre>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h4 className="text-sm font-medium mb-2">Cover Page</h4>
                    {template.cover_image ? (
                        <div className="relative aspect-[1/1.414] w-full border rounded overflow-hidden">
                            <Image 
                                src={template.cover_image} 
                                alt="Cover" 
                                fill 
                                className="object-cover"
                            />
                        </div>
                    ) : (
                        <div className="h-40 bg-slate-100 flex items-center justify-center text-muted-foreground">
                            No Cover Image
                        </div>
                    )}
                </div>

                {template.result_image && (
                     <div>
                     <h4 className="text-sm font-medium mb-2">Result Page</h4>
                     <div className="relative aspect-[1/1.414] w-full border rounded overflow-hidden">
                         <Image 
                             src={template.result_image} 
                             alt="Result" 
                             fill 
                             className="object-cover"
                         />
                     </div>
                 </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
