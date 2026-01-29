"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBreadcrumbStore } from "@/shared/infrastructure/store/breadcrumb.store";
import { usePermissionGuard } from "@/shared/presentation/hooks/usePermissionGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { enrollmentRepository } from "@/modules/enrollment/infrastructure/enrollment.repository";
import { authStore } from "@/modules/auth/infrastructure/auth.store";
import { Enrollment } from "@/modules/enrollment/domain/entities";
import { toast } from "sonner";
import { 
  User, 
  BookOpen, 
  Calendar, 
  Pencil, 
  ArrowLeft,
  GraduationCap,
  Package,
  Users,
  Info,
  Infinity as InfinityIcon,
  Loader2
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { RegistrationFeeCard } from "@/modules/enrollment/presentation/components/RegistrationFeeCard";
import { SaldoPertemuanCard } from "@/modules/enrollment/presentation/components/SaldoPertemuanCard";
import { TransaksiMuridCard } from "@/modules/enrollment/presentation/components/TransaksiMuridCard";

function DetailItem({ icon: Icon, label, value, badge }: { icon: React.ElementType, label: string, value: React.ReactNode, badge?: boolean }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <div className="mt-0.5 p-2 rounded-lg bg-secondary text-secondary-foreground shrink-0">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground font-medium mb-0.5">{label}</p>
        <div className="">
          {badge && value ? (
            <Badge variant="outline" className="font-semibold">{value}</Badge>
          ) : (
            <div className="text-sm font-semibold text-foreground">{value || "-"}</div>
          )}
        </div>
      </div>
    </div>
  );
}

const formatCurrency = (val: number | string | null | undefined) => {
  if (val === null || val === undefined) return "Rp 0";
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(num);
};

export default function EnrollmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { allowed } = usePermissionGuard("enrollment.view");
  const resolvedParams = use(params);
  const id = Number(resolvedParams.id);
  const router = useRouter();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const canUpdate = authStore.hasPermission("enrollment.update");
  const { setItems } = useBreadcrumbStore();

  useEffect(() => {
    setItems([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Enrollment", href: "/dashboard/enrollment" },
      { label: "Detail Enrollment" },
    ]);
  }, [setItems]);

  const fetchData = useCallback(async () => {
    if (!allowed || !id || Number.isNaN(id)) return;
    try {
      const data = await enrollmentRepository.getEnrollment(id);
      setEnrollment(data);
    } catch {
      toast.error("Gagal memuat data enrollment");
      router.replace("/dashboard/enrollment");
    } finally {
      setLoading(false);
    }
  }, [allowed, id, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!allowed) return null;

  if (loading) {
    return (
      <div className="w-full space-y-6 animate-pulse">
        <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
            </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-lg" />
          <div className="lg:col-span-2 space-y-6">
             <Skeleton className="h-64 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!enrollment) return null;

  const formatDate = (s: string | null | undefined) => {
    if (!s) return "-";
    try {
      const d = new Date(s);
      return Number.isNaN(d.getTime()) ? String(s) : d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    } catch {
      return String(s);
    }
  };

  return (
    <div className="w-full pb-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="h-9 w-9">
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight">Detail Enrollment</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="font-mono text-[10px] px-2 py-0 border">
                 {enrollment.kode_enrollment || "N/A"}
              </Badge>
              
              {canUpdate ? (
                <Select
                  disabled={updatingStatus}
                  value={enrollment.status}
                  onValueChange={async (val) => {
                    setUpdatingStatus(true);
                    try {
                      await enrollmentRepository.updateEnrollment(enrollment.id, { status: val });
                      toast.success("Status enrollment berhasil diperbarui");
                      fetchData();
                    } catch {
                      toast.error("Gagal memperbarui status");
                    } finally {
                      setUpdatingStatus(false);
                    }
                  }}
                >
                  <SelectTrigger className={`h-6 text-[11px] font-bold px-2 py-0 w-auto min-w-[80px] border-none shadow-none focus:ring-0 ${
                    enrollment.status === 'Aktif' 
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                      : enrollment.status === 'Pause'
                      ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                      : enrollment.status === 'Selesai'
                      ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}>
                    {updatingStatus ? <Loader2 className="size-3 animate-spin mr-1" /> : null}
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aktif">Aktif</SelectItem>
                    <SelectItem value="Pause">Pause</SelectItem>
                    <SelectItem value="Selesai">Selesai</SelectItem>
                    <SelectItem value="Cancel">Cancel</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant={enrollment.status === "Aktif" ? "outline" : "secondary"} className={enrollment.status === "Aktif" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ""}>
                  {enrollment.status}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canUpdate && (
            <Button asChild>
              <Link href={`/dashboard/enrollment/${enrollment.id}/edit`}>
                <Pencil className="mr-2 size-4" />
                Edit Pendaftaran
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Student & Cost Info */}
        <div className="lg:col-span-1 space-y-6">
             <Card>
                <CardContent className="pt-6">
                  {/* Existing Content */}
                  <div className="flex flex-col items-center text-center pb-6 border-b mb-4">
                     <div className="size-16 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 mb-4 border">
                        <User className="size-8" />
                     </div>
                     <h2 className="text-xl font-bold">{enrollment.murid?.nama_lengkap || "-"}</h2>
                     <p className="text-sm text-muted-foreground mt-1 font-medium">
                        {enrollment.murid?.kode_murid || "BELUM ADA KODE"}
                     </p>
                     <div className="flex gap-2 mt-4">
                        <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                            <Link href={`/dashboard/murid/${enrollment.murid?.id || enrollment.murid_id}`}>
                                Lihat Profil
                            </Link>
                        </Button>
                     </div>
                  </div>

                  <div className="bg-primary/5 rounded-lg p-4 mb-4 border border-primary/10">
                     <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">Total Biaya</p>
                     <p className="text-2xl font-bold text-primary">{formatCurrency(enrollment.harga_final)}</p>
                  </div>

                   {/* Registration Fee Info */}
                   <RegistrationFeeCard enrollment={enrollment} canUpdate={canUpdate} onSuccess={fetchData} />

                  <div className="space-y-1">
                     <DetailItem icon={Users} label="Kapasitas" value={`${enrollment.jumlah_siswa} Siswa`} />
                     <DetailItem icon={Package} label="Tipe Paket" value={enrollment.paket?.nama} />
                  </div>
                </CardContent>
             </Card>

             {/* Saldo Pertemuan Card */}
             <div className="mt-6">
                <SaldoPertemuanCard 
                  enrollmentId={enrollment.id}
                />
             </div>

             {/* Transaksi Murid Card */}
             <div className="mt-6">
                <TransaksiMuridCard 
                  enrollmentId={enrollment.id}
                  statusPendaftaranPaid={enrollment.biaya_pendaftaran_status === 'PAID'}
                />
             </div>
        </div>

        {/* Right Column: Enrollment Info */}
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader className="py-4 border-b">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <GraduationCap className="size-4" /> Katalog & Layanan
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="space-y-1">
                        <DetailItem icon={GraduationCap} label="Jenjang (Level)" value={enrollment.jenjang?.nama} />
                        <DetailItem icon={BookOpen} label="Mata Pelajaran (Program)" value={enrollment.program?.nama} />
                        <DetailItem 
                            icon={Calendar} 
                            label="Periode" 
                            value={
                                <div className="flex items-center gap-1.5">
                                    <span>{enrollment.tanggal_mulai ? formatDate(enrollment.tanggal_mulai) : '-'}</span>
                                    <span className="text-muted-foreground font-normal">s/d</span>
                                    {enrollment.tanggal_selesai ? (
                                        <span>{formatDate(enrollment.tanggal_selesai)}</span>
                                    ) : (
                                        <InfinityIcon className="size-3.5 text-muted-foreground" />
                                    )}
                                </div>
                            } 
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="py-4 border-b">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Info className="size-4" /> Metadata & Catatan
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                         <DetailItem icon={User} label="Dibuat Oleh" value={enrollment.creator?.name || "Sistem"} />
                         <DetailItem icon={Calendar} label="Waktu Pendaftaran" value={formatDate(enrollment.created_at)} />
                      </div>
                      <div className="space-y-1">
                         <DetailItem icon={Calendar} label="Terakhir Diperbarui" value={formatDate(enrollment.updated_at)} />
                      </div>
                   </div>
                   <div className="mt-4">
                      <p className="text-xs text-muted-foreground font-medium mb-1.5">Catatan Tambahan</p>
                      <div className="p-3 bg-slate-50 rounded-lg text-sm text-muted-foreground leading-relaxed italic border border-slate-100">
                         {enrollment.catatan || "Tidak ada catatan tambahan untuk pendaftaran ini."}
                      </div>
                   </div>
                </CardContent>
            </Card>

            {/* Class & Schedule Information */}
            <Card>
                <CardHeader className="py-4 border-b">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Calendar className="size-4" /> Informasi Kelas & Jadwal
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                    {enrollment.kelas && enrollment.kelas.length > 0 ? (
                        <div className="space-y-6">
                            {enrollment.kelas.map((kls) => (
                                <div key={kls.id} className="space-y-4 pb-4 last:pb-0 border-b last:border-0 border-dashed">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                                                <Users className="size-4" />
                                            </div>
                                            <div>
                                                <Link href={`/dashboard/kelas/${kls.id}`} className="text-sm font-bold hover:underline">
                                                    {kls.nama_kelas}
                                                </Link>
                                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{kls.kode_kelas}</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-[10px] uppercase">{kls.tipe_kelas}</Badge>
                                    </div>

                                    <div className="pl-11 space-y-3">
                                        <p className="text-xs font-semibold text-muted-foreground">Jadwal Pertemuan:</p>
                                        {kls.schedules && kls.schedules.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {kls.schedules.map((sch) => (
                                                    <div key={sch.id} className="p-3 rounded-lg border bg-slate-50/50 flex flex-col gap-1.5">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-bold">{sch.hari}</span>
                                                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white border border-slate-200 uppercase">{sch.mata_pelajaran}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[11px] text-slate-600">
                                                            <div className="flex items-center gap-1 font-mono">
                                                                <Info className="size-3" />
                                                                {sch.jam_mulai} - {sch.jam_selesai}
                                                            </div>
                                                            <span className="text-slate-300">|</span>
                                                            <div className="flex items-center gap-1 truncate">
                                                                <User className="size-3 shrink-0" />
                                                                <span className="truncate">{sch.guru_pengajar?.user?.name || '-'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground italic bg-slate-50 p-3 rounded-lg border border-dashed">
                                                Belum ada jadwal yang diatur untuk kelas ini.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center border-2 border-dashed rounded-lg bg-muted/20">
                            <Info className="size-8 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground font-medium">Siswa belum dimasukkan ke kelas manapun.</p>
                            <Button asChild variant="link" size="sm" className="mt-2 text-rose-600 h-auto p-0 font-bold">
                                <Link href="/dashboard/kelas">
                                    Kelola Kelas
                                </Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
