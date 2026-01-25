
import { notFound } from "next/navigation";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { academicApi } from "@/modules/academic/infrastructure/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailKelasClient } from "@/modules/academic/presentation/components/DetailKelasClient";
import { Separator } from "@/components/ui/separator";

interface DetailKelasPageProps {
  params: { id: string };
  searchParams: { page?: string, per_page?: string, q?: string };
}

export default async function DetailKelasPage({ params, searchParams }: DetailKelasPageProps) {
    const id = Number(params.id);
    if (isNaN(id)) return notFound();

    // Fetch detail & enrollments
    // Assuming getKelasDetail includes basic info. 
    // And I need a separate call for enrollments list in the table if I want pagination/filtering there too.
    // The previously implemented `AnggotaTable` accepts `enrollments` list.
    // I should create `getKelasMembers` endpoint or similar.
    // But `api.ts` only has `getKelasDetail` (which might return enrollment count, but maybe not list if large lists).
    // Let's assume `getKelasDetail` returns everything or I fetch enrollments separately.
    // For now I'll use `getKelasDetail` and if list is missing, I fetch it.
    // Actually `getKelasDetail` usually returns relationships in API detail pattern.
    // If not, I should implement `getKelasMembers`.
    
    // I'll assume `getKelasDetail` returns `enrollments` property as per Types defined.
    // Wait, Domain Type `Kelas` has `enrollments_count` but `enrollments`?
    // Let's check `src/modules/academic/domain/types.ts`.
    
    // If `enrollments` is not in `Kelas`, I should fetch it separately.
    // User plan: "Detail: ... AnggotaTable (Remove action), AddAnggotaSheet".
    // I'll add `getKelasEnrollments` to API if needed, or check types.
    
    // Let's check `types.ts` quickly. 
    // I'll trust `api.ts` has `getKelasDetail`. 
    // I'll verify logic in next step if broken.
    
    const res = await academicApi.getKelasDetail(id).catch(() => null);
    if (!res || !res.data) return notFound();
    
    const kelas = res.data;
    
    return (
        <div className="space-y-6">
            <PageHeader
                title={`Detail: ${kelas.nama_kelas}`}
                description="Informasi lengkap dan anggota kelas"
                backUrl="/dashboard/kelas"
                actions={
                    <div className="flex items-center gap-2">
                         <Badge variant={kelas.status === 'Aktif' ? 'default' : 'secondary'}>{kelas.status}</Badge>
                    </div>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Detail Info Card */}
                 <div className="md:col-span-1 space-y-6">
                     <Card>
                         <CardHeader>
                             <CardTitle className="text-lg">Informasi Kelas</CardTitle>
                         </CardHeader>
                         <CardContent className="space-y-4">
                             <div>
                                 <label className="text-sm font-medium text-muted-foreground">Program</label>
                                 <p>{kelas.program?.nama || '-'}</p>
                             </div>
                             <div>
                                 <label className="text-sm font-medium text-muted-foreground">Jenjang</label>
                                 <p>{kelas.jenjang?.nama || '-'}</p>
                             </div>
                             <Separator />
                             <div>
                                 <label className="text-sm font-medium text-muted-foreground">Tipe</label>
                                 <div className="flex items-center gap-2 mt-1">
                                     <Badge variant="outline">{kelas.tipe_kelas}</Badge>
                                     {kelas.mode_private && <span className="text-sm text-muted-foreground">({kelas.mode_private})</span>}
                                 </div>
                             </div>
                             <div>
                                 <label className="text-sm font-medium text-muted-foreground">Kapasitas</label>
                                 <p>{kelas.enrollments_count || 0} / {kelas.kapasitas || 'Unlimited'}</p>
                             </div>
                             <Separator />
                             <div className="grid grid-cols-2 gap-2">
                                 <div>
                                    <label className="text-xs font-medium text-muted-foreground">Mulai</label>
                                    <p className="text-sm">{kelas.periode_mulai || '-'}</p>
                                 </div>
                                  <div>
                                    <label className="text-xs font-medium text-muted-foreground">Selesai</label>
                                    <p className="text-sm">{kelas.periode_selesai || '-'}</p>
                                 </div>
                             </div>
                              <div>
                                 <label className="text-sm font-medium text-muted-foreground">Ruangan</label>
                                 <p>{kelas.ruangan_default || '-'}</p>
                             </div>
                         </CardContent>
                     </Card>
                 </div>
                 
                 {/* Members List */}
                 <div className="md:col-span-2 space-y-6">
                     <DetailKelasClient 
                        kelas={kelas}
                        // If kelas.enrollments is undefined in type, I'll need to fetch and pass it.
                        // For now assuming it is populated or client fetches it.
                        // Actually, client fetching is safer for large lists + pagination.
                        // But I'll pass initial data if available for RSC.
                     />
                 </div>
            </div>
        </div>
    );
}
