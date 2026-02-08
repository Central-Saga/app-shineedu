import { useMemo } from "react";
import { Clock, MapPin, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { JadwalKerja } from "../../domain/entities";

interface JadwalKerjaBoardProps {
  items: JadwalKerja[];
  onSelectEvent: (item: JadwalKerja) => void;
  groupBy?: "hari" | "ruangan";
}

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export function JadwalKerjaBoard({ items, onSelectEvent, groupBy = "hari" }: JadwalKerjaBoardProps) {
  // Group items
  const { groups, columns } = useMemo(() => {
    const g: Record<string, JadwalKerja[]> = {};
    let cols: string[] = [];

    if (groupBy === "hari") {
      cols = DAYS;
      cols.forEach((day) => {
        g[day] = [];
      });
      items.forEach((item) => {
        if (g[item.hari]) {
          g[item.hari].push(item);
        }
      });
    } else {
      // Group by Ruangan
      const uniqueRooms = Array.from(new Set(items.map((i) => i.ruangan_kelas || "Tanpa Ruangan"))).sort((a, b) => {
          if (a === "Tanpa Ruangan") return 1;
          if (b === "Tanpa Ruangan") return -1;
          return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
      });
      cols = uniqueRooms;
      cols.forEach((room) => {
        g[room] = [];
      });
      items.forEach((item) => {
        const room = item.ruangan_kelas || "Tanpa Ruangan";
        g[room].push(item);
      });
    }

    // Sort items by time within each group
    Object.keys(g).forEach((key) => {
      g[key].sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai));
    });

    return { groups: g, columns: cols };
  }, [items, groupBy]);

  return (
    <div className="flex h-[calc(100vh-220px)] overflow-x-auto pb-4 gap-4">
      {columns.map((col) => (
        <div key={col} className="flex-shrink-0 w-[300px] flex flex-col h-full">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="font-semibold text-slate-900 truncate max-w-[220px]">{col}</h3>
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
                    item.status === 'Aktif' 
                        ? item.kategori === 'coding' 
                            ? "border-l-blue-500 hover:border-blue-400" 
                            : "border-l-amber-500 hover:border-amber-400"
                        : "border-l-slate-300 opacity-70 grayscale"
                  )}
                  onClick={() => onSelectEvent(item)}
                >
                  <CardContent className="p-3 space-y-2.5">
                    {/* Header: Time & Status */}
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                            <Clock className="w-3 h-3 mr-1.5 text-slate-400" />
                            {item.jam_mulai.substring(0, 5)} - {item.jam_selesai.substring(0, 5)}
                        </div>
                        {item.status === 'Non Aktif' && (
                             <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-slate-200 text-slate-400">
                                Non-Aktif
                             </Badge>
                        )}
                    </div>

                    {/* Subject Title */}
                    <div>
                        <h4 className="font-semibold text-slate-800 text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">
                            {item.mata_pelajaran}
                        </h4>
                        
                        <div className="mt-1 flex flex-wrap gap-1.5">
                             {/* Category Badge */}
                            <Badge variant="secondary" className={cn(
                                "text-[10px] h-5 px-1.5 font-normal border",
                                item.kategori === 'coding' 
                                    ? "bg-blue-50 text-blue-700 border-blue-100" 
                                    : "bg-amber-50 text-amber-700 border-amber-100"
                            )}>
                                {item.kategori === 'coding' ? 'Coding' : 'Non-Coding'}
                            </Badge>
                             {/* Show Day if grouped by Room, or show Room if grouped by Day */}
                             {groupBy === 'ruangan' ? (
                                <div className="flex items-center text-[10px] text-slate-500 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-sm">
                                    <div className="w-1 h-1 rounded-full bg-indigo-400 mr-1.5" />
                                    {item.hari}
                                </div>
                             ) : item.ruangan_kelas && (
                                <div className="flex items-center text-[10px] text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-sm">
                                    <MapPin className="w-2.5 h-2.5 mr-1" />
                                    {item.ruangan_kelas}
                                </div>
                             )}
                        </div>
                    </div>

                    {/* Footer: User/Teacher */}
                    <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
                         <div className="flex items-center gap-2 min-w-0">
                            <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0",
                                item.guru_pengajar?.user?.name ? "bg-indigo-500" : "bg-slate-300"
                            )}>
                                {item.guru_pengajar?.user?.name?.charAt(0) || <User className="w-3 h-3" />}
                            </div>
                            <span className="text-xs text-slate-600 truncate font-medium">
                                {item.guru_pengajar?.user?.name || "No Teacher"}
                            </span>
                         </div>
                    </div>
                    
                  </CardContent>
                </Card>
              ))}

              {groups[col].length === 0 && (
                <div className="h-24 flex items-center justify-center text-slate-400 text-xs italic border-2 border-dashed border-slate-200 rounded-lg">
                  Tidak ada jadwal
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
