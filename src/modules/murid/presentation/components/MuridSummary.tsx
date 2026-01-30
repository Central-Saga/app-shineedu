"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  XCircle, 
  BookOpen,
  Calendar,
  AlertCircle,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MuridSummaryProps {
  murid: any; // We'll use the record from API which has enrollments and absensi_summary
}

export function MuridSummary({ murid }: MuridSummaryProps) {
  const absensi = murid.absensi_summary || { total: 0, hadir: 0, tidak_hadir: 0 };
  const enrollments = murid.enrollments || [];

  const presenceRate = absensi.total > 0 
    ? Math.round((absensi.hadir / absensi.total) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Attendance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-emerald-50 border-emerald-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Hadir</p>
                <p className="text-2xl font-bold text-emerald-700">{absensi.hadir}</p>
              </div>
              <div className="p-2 bg-white rounded-lg text-emerald-600 shadow-sm">
                <CheckCircle2 className="size-5" />
              </div>
            </div>
            <p className="text-[10px] text-emerald-600/70 mt-2 font-medium">Tingkat Kehadiran: {presenceRate}%</p>
          </CardContent>
        </Card>

        <Card className="bg-rose-50 border-rose-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-rose-600 uppercase tracking-wider">Tidak Hadir</p>
                <p className="text-2xl font-bold text-rose-700">{absensi.tidak_hadir || 0}</p>
              </div>
              <div className="p-2 bg-white rounded-lg text-rose-600 shadow-sm">
                <XCircle className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wider">Total Sesi</p>
                <p className="text-2xl font-bold text-slate-700">{absensi.total}</p>
              </div>
              <div className="p-2 bg-white rounded-lg text-slate-600 shadow-sm">
                <Calendar className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Programs Followed */}
      <Card>
        <CardHeader className="py-4 border-b">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <BookOpen className="size-4" /> Program & Kursus yang Diikuti
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {enrollments.length > 0 ? (
            <div className="divide-y">
              {enrollments.map((en: any) => (
                <div key={en.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-800">{en.program?.nama || "Program"}</h4>
                      <Badge variant="outline" className="text-[10px] h-5">
                        {en.kode_enrollment}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="size-3" />
                      {en.tanggal_mulai ? new Date(en.tanggal_mulai).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) : "-"} 
                      {en.tanggal_selesai && ` s/d ${new Date(en.tanggal_selesai).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}`}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                       <Badge variant="secondary" className="bg-slate-100 text-[10px]">
                          {en.paket?.nama || "Paket"}
                       </Badge>
                       <Badge variant="secondary" className="bg-slate-100 text-[10px]">
                          {en.jenjang?.nama || "Jenjang"}
                       </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                       <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Status</p>
                       <Badge 
                        variant={en.status === "Aktif" ? "default" : "outline"}
                        className={en.status === "Aktif" ? "bg-emerald-500" : ""}
                       >
                         {en.status}
                       </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center">
              <AlertCircle className="size-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Belum ada program yang diikuti.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance History Details */}
      <Card>
        <CardHeader className="py-4 border-b">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <History className="size-4" /> Riwayat Kehadiran (Log Absensi)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {murid.absensi_history && murid.absensi_history.length > 0 ? (
            <div className="divide-y max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {murid.absensi_history.map((abs: any) => {
                // Map status to display label
                const getStatusLabel = (status: string) => {
                  if (status === 'HADIR') return 'Hadir';
                  if (status === 'TIDAK_HADIR') return 'Tidak Hadir';
                  if (status === 'PINDAH_JADWAL') return 'Pindah Jadwal';
                  // Fallback for old data
                  if (status === 'IZIN' || status === 'SAKIT' || status === 'ALPHA') return 'Tidak Hadir';
                  if (status === 'BATAL') return 'Pindah Jadwal';
                  return status;
                };

                const statusLabel = getStatusLabel(abs.status);
                const isHadir = abs.status === 'HADIR';
                const isPindah = abs.status === 'PINDAH_JADWAL' || abs.status === 'BATAL';

                return (
                <div key={abs.id} className="py-3 flex items-center justify-between hover:bg-slate-50 transition-colors px-2 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "size-9 rounded-full flex items-center justify-center shrink-0",
                      isHadir ? "bg-emerald-50 text-emerald-600" :
                      isPindah ? "bg-blue-50 text-blue-600" :
                      "bg-rose-50 text-rose-600"
                    )}>
                      <Calendar className="size-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800">
                        {abs.tanggal ? new Date(abs.tanggal).toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }) : "-"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {abs.catatan && (
                      <span className="text-[10px] text-slate-400 italic max-w-[150px] truncate hidden md:block">
                        {abs.catatan}
                      </span>
                    )}
                    <Badge 
                      variant="outline"
                      className={cn(
                        "text-[10px] font-bold px-2 h-6 uppercase tracking-tight",
                        isHadir ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                        isPindah ? "bg-blue-50 text-blue-700 border-blue-100" :
                        "bg-rose-50 text-rose-700 border-rose-100"
                      )}
                    >
                      {statusLabel}
                    </Badge>
                  </div>
                </div>
              )})}
            </div>
          ) : (
            <div className="py-10 text-center">
              <AlertCircle className="size-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Belum ada riwayat absensi.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
