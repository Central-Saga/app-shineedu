"use client";

import { useEffect, useState } from "react";
import { sesiApi } from "../api/sesi.api";
import { LogbookSesi } from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar, 
  ChevronRight, 
  Search, 
  BookOpen,
  Clock,
  History,
  Archive
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface SesiLogbookSummaryListProps {
  kelasId: number;
}

export function SesiLogbookSummaryList({ kelasId }: SesiLogbookSummaryListProps) {
  const [logbooks, setLogbooks] = useState<LogbookSesi[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchLogbooks = async () => {
      try {
        const data = await sesiApi.getLogbooksByKelas(kelasId);
        setLogbooks(data);
      } catch (error) {
        console.error("Failed to fetch class logbooks", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogbooks();
  }, [kelasId]);

  const filteredLogbooks = logbooks.filter(lb => 
    lb.ringkasan?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    lb.materi?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lb.session?.tanggal.includes(searchQuery)
  );

  const displayedLogbooks = showAll ? filteredLogbooks : filteredLogbooks.slice(0, 5);
  const hasMore = filteredLogbooks.length > 5;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (logbooks.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <BookOpen className="size-10 text-slate-200 mb-3" />
          <p className="text-sm text-muted-foreground">Belum ada ringkasan logbook untuk kelas ini.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari materi atau ringkasan..." 
            className="w-full pl-10 pr-4 py-2 bg-white border rounded-lg text-sm transition-all outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
           <Badge variant="secondary" className="font-semibold px-3 py-1 bg-slate-100 text-slate-600 border-none">
              {filteredLogbooks.length} Laporan
           </Badge>
           {hasMore && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowAll(!showAll)}
                className="text-xs font-bold gap-1.5 h-8"
              >
                {showAll ? (
                  <><History className="size-3.5" /> Lihat 5 Terakhir</>
                ) : (
                  <><Archive className="size-3.5" /> Lihat Semua Arsip</>
                )}
              </Button>
           )}
        </div>
      </div>

      <Accordion type="single" collapsible className="space-y-3">
        {displayedLogbooks.map((logbook) => (
          <AccordionItem 
            key={logbook.sesi_id} 
            value={`item-${logbook.sesi_id}`}
            className="border rounded-xl bg-white overflow-hidden shadow-xs border-slate-200"
          >
            <div className="flex items-center w-full group">
               <AccordionTrigger className="flex-1 py-3 px-4 hover:no-underline hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-left w-full">
                     <div className="flex items-center gap-2 min-w-[180px]">
                        <div className="size-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                           <Calendar className="size-4" />
                        </div>
                        <div className="flex flex-col">
                           <span className="text-sm font-bold text-slate-800">
                              {logbook.session?.tanggal ? format(new Date(logbook.session.tanggal), "d MMM yyyy", { locale: id }) : "-"}
                           </span>
                           <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              {logbook.session?.tanggal ? format(new Date(logbook.session.tanggal), "eeee", { locale: id }) : "-"}
                           </span>
                        </div>
                     </div>
                     <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded-md">
                        <Clock className="size-3.5" />
                        {logbook.session?.jam_mulai_plan.slice(0, 5)} - {logbook.session?.jam_selesai_plan.slice(0, 5)}
                     </div>
                     <div className="flex-1 text-sm text-slate-600 truncate max-w-[300px]">
                        {logbook.ringkasan?.replace(/<[^>]*>/g, '') || "Tidak ada ringkasan."}
                     </div>
                  </div>
               </AccordionTrigger>
               
               <div className="pr-4 py-2 flex items-center">
                  <Button asChild variant="ghost" size="sm" className="h-8 text-rose-600 hover:text-rose-700 font-bold gap-1 px-2">
                    <Link href={`/dashboard/kelas/${kelasId}/sesi/${logbook.sesi_id}`}>
                       Detail <ChevronRight className="size-3.5" />
                    </Link>
                  </Button>
               </div>
            </div>

            <AccordionContent className="border-t bg-slate-50/30">
               <div className="p-5 space-y-6">
                  {logbook.ringkasan && (
                    <div className="space-y-2">
                       <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ringkasan Sesi</h4>
                       <div 
                         className="wysiwyg-viewer max-w-none"
                         dangerouslySetInnerHTML={{ __html: logbook.ringkasan }}
                       />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                     <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Materi Pelajaran</h4>
                        {logbook.materi ? (
                          <div 
                            className="wysiwyg-viewer max-w-none text-slate-600"
                            dangerouslySetInnerHTML={{ __html: logbook.materi }}
                          />
                        ) : (
                          <p className="text-xs text-slate-400 italic">Tidak ada catatan materi.</p>
                        )}
                     </div>
                     <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tugas (PR)</h4>
                        {logbook.homework ? (
                          <div 
                            className="wysiwyg-viewer max-w-none text-slate-600"
                            dangerouslySetInnerHTML={{ __html: logbook.homework }}
                          />
                        ) : (
                          <p className="text-xs text-slate-400 italic">Tidak ada PR diberikan.</p>
                        )}
                     </div>
                  </div>
               </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {!showAll && hasMore && (
        <div className="flex justify-center pt-2">
           <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowAll(true)}
            className="text-slate-400 hover:text-slate-600 font-bold gap-2 text-xs"
           >
              Lihat {filteredLogbooks.length - 5} Laporan Lainnya di Arsip <ChevronRight className="size-4" />
           </Button>
        </div>
      )}
    </div>
  );
}
