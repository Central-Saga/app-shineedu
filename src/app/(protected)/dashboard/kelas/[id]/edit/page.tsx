
import { notFound } from "next/navigation";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { academicApi } from "@/modules/academic/infrastructure/api";
import { KelasFormWrapper } from "@/modules/academic/presentation/components/KelasFormWrapper";

interface EditKelasPageProps {
  params: { id: string };
}

export default async function EditKelasPage({ params }: EditKelasPageProps) {
    const id = Number(params.id);
    if (isNaN(id)) return notFound();

    // Fetch data concurrently
    const [kelasRes, programsRes, jenjangsRes] = await Promise.all([
        academicApi.getKelasDetail(id).catch(() => null),
        academicApi.getPrograms().catch(() => ({ data: [] })),
        academicApi.getJenjangs().catch(() => ({ data: [] }))
    ]);

    if (!kelasRes || !kelasRes.data) {
        return notFound();
    }

    return (
        <div className="space-y-6">
             <PageHeader
                title={`Edit Kelas: ${kelasRes.data.nama_kelas}`}
                description="Perbarui informasi kelas"
                backUrl="/dashboard/kelas"
            />
            
            <div className="max-w-4xl mx-auto">
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <KelasFormWrapper 
                        initialData={kelasRes.data}
                        programs={programsRes.data || []}
                        jenjangs={jenjangsRes.data || []}
                        isEdit={true}
                        kelasId={id}
                    />
                </div>
            </div>
        </div>
    );
}
