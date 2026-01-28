"use client";

import { useEffect, useState } from "react";
import { sesiApi } from "../api/sesi.api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar, 
  ChevronRight, 
  Search, 
  BookOpen,
  Clock,
  History,
  Archive,
  AlertCircle
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
import { cn } from "@/lib/utils";

interface SesiLogbookSummaryListProps {
  kelasId: number;
}

export function SesiLogbookSummaryList({ kelasId }: SesiLogbookSummaryListProps) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await sesiApi.getLogbooksByKelas(kelasId);
        setSessions(data);
      } catch (error) {
        console.error("Failed to fetch class logbooks", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [kelasId]);

  const filteredSessions = sessions.filter(s => {
    const lb = s.logbook;
    return (
      s.tanggal.includes(searchQuery) ||
      lb?.ringkasan?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      lb?.materi?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const displayedSessions = showAll ? filteredSessions : filteredSessions.slice(0, 5);
  const hasMore = filteredSessions.length > 5;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <BookOpen className="size-10 text-slate-200 mb-3" />
          <p className="text-sm text-muted-foreground">Belum ada sesi yang diselesaikan untuk kelas ini.</p>
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
            className="w-full pl-10 pr-4 py-2 bg-white border rounded-lg text-sm transition-all outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
           <Badge variant="secondary" className="font-semibold px-3 py-1 bg-slate-100 text-slate-600 border-none">
              {filteredSessions.length} Sesi Terlaksana
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
        {displayedSessions.map((session) => {
          const logbook = session.logbook;
          const hasSummary = logbook && (logbook.ringkasan || logbook.materi);
          
          return (
            <AccordionItem 
              key={session.id} 
              value={`item-${session.id}`}
              className={cn(
                  "border rounded-xl bg-white overflow-hidden shadow-xs transition-all",
                  !hasSummary ? "border-amber-200 bg-amber-50/20" : "border-slate-200"
              )}
            >
              <div className="flex items-center w-full group">
                 <AccordionTrigger className="flex-1 py-3 px-4 hover:no-underline hover:bg-slate-50/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-left w-full">
                       <div className="flex items-center gap-2 min-w-[170px]">
                          <div className={cn(
                              "size-8 rounded-lg flex items-center justify-center shrink-0",
                              hasSummary ? "bg-rose-50 text-rose-600" : "bg-amber-100 text-amber-600"
                          )}>
                             <Calendar className="size-4" />
                          </div>
                          <div className="flex flex-col">
                             <span className="text-sm font-bold text-slate-800">
                                {format(new Date(session.tanggal), "d MMM yyyy", { locale: id })}
                             </span>
                             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                {format(new Date(session.tanggal), "eeee", { locale: id })}
                             </span>
                          </div>
                       </div>
                       <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded-md shrink-0">
                          <Clock className="size-3.5" />
                          {session.jam_mulai_plan?.slice(0, 5)} - {session.jam_selesai_plan?.slice(0, 5)}
                       </div>
                       <div className="flex-1 text-sm text-slate-600 truncate max-w-[300px]">
                          {hasSummary ? (
                              logbook.ringkasan?.replace(/<[^>]*>/g, '') || logbook.materi?.replace(/<[^>]*>/g, '')
                          ) : (
                              <span className="text-amber-600 font-medium flex items-center gap-1">
                                  <AlertCircle className="size-3.5" /> Logbook belum diisi oleh pengajar
                              </span>
                          )}
                       </div>
                    </div>
                 </AccordionTrigger>
                 
                 <div className="pr-4 py-2 flex items-center">
                    <Button asChild variant="ghost" size="sm" className="h-8 text-rose-600 hover:text-rose-700 font-bold gap-1 px-2">
                      <Link href={`/dashboard/kelas/${kelasId}/sesi/${session.id}`}>
                         Detail <ChevronRight className="size-3.5" />
                      </Link>
                    </Button>
                 </div>
              </div>
  
              <AccordionContent className="border-t bg-slate-50/30">
                 <div className="p-5 space-y-6">
                    {hasSummary ? (
                        <>
                            {logbook.ringkasan && (
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ringkasan Sesi</h4>
                                    <div 
                                        className="wysiwyg-viewer max-w-none bg-white p-4 rounded-lg border border-slate-100 shadow-sm"
                                        dangerouslySetInnerHTML={{ __html: logbook.ringkasan }}
                                    />
                                </div>
                            )}
          
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Materi Pelajaran</h4>
                                    {logbook.materi ? (
                                        <div 
                                            className="wysiwyg-viewer max-w-none text-slate-600 bg-white p-3 rounded-lg border border-slate-50 shadow-xs"
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
                                            className="wysiwyg-viewer max-w-none text-slate-600 bg-white p-3 rounded-lg border border-slate-50 shadow-xs"
                                            dangerouslySetInnerHTML={{ __html: logbook.homework }}
                                        />
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">Tidak ada PR diberikan.</p>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                            <div className="size-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                                <BookOpen className="size-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">Ringkasan Materi Belum Tersedia</h4>
                                <p className="text-sm text-slate-500 max-w-md mt-1">
                                    Pengajar belum mendokumentasikan ringkasan kegiatan dan materi untuk sesi ini. 
                                    Harap hubungi pengajar terkait atau isi melalui tombol detail di atas.
                                </p>
                            </div>
                            <Button asChild size="sm" variant="outline" className="mt-2 border-amber-200 hover:bg-amber-50 text-amber-700">
                                <Link href={`/dashboard/kelas/${kelasId}/sesi/${session.id}`}>
                                    Isi Logbook Sekarang
                                </Link>
                            </Button>
                        </div>
                    )}
                 </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {!showAll && hasMore && (
        <div className="flex justify-center pt-2">
           <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowAll(true)}
            className="text-slate-400 hover:text-slate-600 font-bold gap-2 text-xs"
           >
              Lihat {filteredSessions.length - 5} Laporan Lainnya di Arsip <ChevronRight className="size-4" />
           </Button>
        </div>
      )}
    </div>
  );
}
