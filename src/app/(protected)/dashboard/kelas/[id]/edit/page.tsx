import { notFound } from "next/navigation";
import { PageHeader } from "@/shared/presentation/components/PageHeader";
import { academicApi } from "@/modules/academic/infrastructure/api";
import { KelasFormWrapper } from "@/modules/academic/presentation/components/KelasFormWrapper";

export default async function EditKelasPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    
    if (isNaN(id)) return notFound();

    // Fetch data concurrently
    const [kelasRes, programsRes, jenjangsRes] = await Promise.all([
        academicApi.getKelasDetail(id).catch((e) => {
            console.error("Error fetching kelas detail:", e);
            return null;
        }),
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
            />
            
            <div className="max-w-4xl mx-auto">
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <KelasFormWrapper 
                        initialData={kelasRes.data}
                        programs={programsRes.data as any}
                        jenjangs={jenjangsRes.data as any}
                        isEdit={true}
                        kelasId={id}
                    />
                </div>
            </div>
        </div>
    );
}
