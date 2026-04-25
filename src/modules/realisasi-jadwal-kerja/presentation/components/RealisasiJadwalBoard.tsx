"use client";

import { useMemo } from "react";
import { Clock, MapPin, User, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RealisasiJadwal } from "../../domain/entities";

interface RealisasiJadwalBoardProps {
  items: RealisasiJadwal[];
  onSelectEvent: (item: RealisasiJadwal) => void;
  groupBy?: "tanggal" | "status";
}

const STATUS_ORDER = ["diajukan", "disetujui", "ditolak"];

export function RealisasiJadwalBoard({ items, onSelectEvent, groupBy = "tanggal" }: RealisasiJadwalBoardProps) {
  const { groups, columns } = useMemo(() => {
    const g: Record<string, RealisasiJadwal[]> = {};
    let cols: string[] = [];

    if (groupBy === "status") {
      cols = STATUS_ORDER;
      cols.forEach((status) => {
        g[status] = [];
      });
      items.forEach((item) => {
        if (g[item.status]) {
          g[item.status].push(item);
        }
      });
    } else {
      const uniqueDates = Array.from(new Set(items.map((i) => i.tanggal))).sort();
      cols = uniqueDates;
      cols.forEach((date) => {
        g[date] = [];
      });
      items.forEach((item) => {
        if (g[item.tanggal]) {
          g[item.tanggal].push(item);
        }
      });
    }

    Object.keys(g).forEach((key) => {
      g[key].sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
    });

    return { groups: g, columns: cols };
  }, [items, groupBy]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "disetujui":
        return "border-l-emerald-500 hover:border-emerald-400";
      case "ditolak":
        return "border-l-rose-500 hover:border-rose-400";
      default:
        return "border-l-amber-500 hover:border-amber-400";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "disetujui":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "ditolak":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  const formatColumnTitle = (col: string) => {
    if (groupBy === "status") {
      return col.charAt(0).toUpperCase() + col.slice(1);
    }
    try {
      const d = new Date(col);
      return d.toLocaleDateString("id-ID", { 
        weekday: "short", 
        day: "numeric", 
        month: "short" 
      });
    } catch {
      return col;
    }
  };

  return (
    <div className="flex h-[calc(100vh-220px)] overflow-x-auto pb-4 gap-4">
      {columns.map((col) => (
        <div key={col} className="flex-shrink-0 w-[320px] flex flex-col h-full">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="font-semibold text-slate-900 truncate max-w-[220px]">
              {formatColumnTitle(col)}
            </h3>
            <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs font-mono">
              {groups[col].length}
            </Badge>
          </div>
          
          <div className="bg-slate-50/50 rounded-xl border border-slate-200/60 flex-1 p-2 overflow-y-auto custom-scrollbar">
            <div className="space-y-3">
              {groups[col].map((item) => (
                <Card 
                  key={item.id} 
                  className={cn(
                    "cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 group relative overflow-hidden",
                    getStatusColor(item.status)
                  )}
                  onClick={() => onSelectEvent(item)}
                >
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-slate-900 text-sm line-clamp-2 flex-1">
                        {item.jadwal_kerja?.mata_pelajaran || "-"}
                      </h4>
                      <Badge 
                        variant="outline" 
                        className={cn("text-[10px] shrink-0", getStatusBadge(item.status))}
                      >
                        {item.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        <span>{new Date(item.tanggal).toLocaleDateString("id-ID")}</span>
                      </div>
                      {item.ruangan_kelas && (
                        <div className="flex items-center gap-1">
                          <MapPin className="size-3" />
                          <span>{item.ruangan_kelas}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-xs text-slate-600">
                      <User className="size-3 text-slate-400" />
                      <span className="truncate">
                        {item.guru_pengajar?.user?.name || item.jadwal_kerja?.guru_pengajar?.user?.name || "-"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {groups[col].length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Tidak ada realisasi
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
