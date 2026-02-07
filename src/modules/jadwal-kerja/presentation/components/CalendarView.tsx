"use client";

import { useMemo } from "react";
import { Calendar, dateFnsLocalizer, Views, ToolbarProps } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { id } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import type { JadwalKerja } from "../../domain/entities";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock, MapPin, User } from "lucide-react";

const locales = {
  "id": id,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // Monday start
  getDay,
  locales,
});

interface CalendarViewProps {
  items: JadwalKerja[];
  onSelectEvent: (item: JadwalKerja) => void;
}

const dayMap: Record<string, number> = {
  "Senin": 1,
  "Selasa": 2,
  "Rabu": 3,
  "Kamis": 4,
  "Jumat": 5,
  "Sabtu": 6,
  "Minggu": 0,
};

// Custom Toolbar Component
const CustomToolbar = (props: ToolbarProps) => {
  const { label, view, onNavigate, onView } = props;

  const navigate = (action: 'PREV' | 'NEXT' | 'TODAY') => {
    onNavigate(action);
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => navigate('TODAY')} className="h-8 text-xs font-semibold">
          Hari Ini
        </Button>
        <div className="flex items-center bg-white border rounded-lg p-0.5">
          <Button variant="ghost" size="icon" onClick={() => navigate('PREV')} className="h-7 w-7">
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate('NEXT')} className="h-7 w-7">
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <h2 className="text-sm font-bold text-slate-700 ml-2 capitalize">{label}</h2>
      </div>

      <div className="flex items-center gap-1 bg-white border rounded-lg p-1">
        <Button 
          variant={view === Views.WEEK ? 'secondary' : 'ghost'} 
          size="sm" 
          onClick={() => onView(Views.WEEK)}
          className="h-7 text-[11px] px-3 font-medium"
        >
          Minggu
        </Button>
        <Button 
          variant={view === Views.DAY ? 'secondary' : 'ghost'} 
          size="sm" 
          onClick={() => onView(Views.DAY)}
          className="h-7 text-[11px] px-3 font-medium"
        >
          Hari
        </Button>
      </div>
    </div>
  );
};

export function CalendarView({ items, onSelectEvent }: CalendarViewProps) {
  const events = useMemo(() => {
    const today = new Date();
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });

    return items.map((item) => {
      const dayIndex = dayMap[item.hari];
      if (dayIndex === undefined) return null;

      const eventDate = new Date(startOfCurrentWeek);
      eventDate.setDate(startOfCurrentWeek.getDate() + (dayIndex === 0 ? 6 : dayIndex - 1));

      const [startHour, startMinute] = item.jam_mulai.split(":").map(Number);
      const [endHour, endMinute] = item.jam_selesai.split(":").map(Number);

      const start = new Date(eventDate);
      start.setHours(startHour, startMinute, 0);

      const end = new Date(eventDate);
      end.setHours(endHour, endMinute, 0);

      const isKosong = !item.mata_pelajaran || item.mata_pelajaran.trim() === "";

      return {
        id: item.id,
        title: item.mata_pelajaran || "Jadwal Kosong",
        start,
        end,
        resource: item,
        isKosong
      };
    }).filter((e): e is any => !!e);
  }, [items]);

  return (
    <div className="w-full space-y-4">
        {/* Legend */}
        <div className="flex items-center gap-4 text-[10px] font-medium text-slate-500 uppercase tracking-wider px-1">
            <div className="flex items-center gap-1.5">
                <div className="size-2 rounded-full bg-blue-500" />
                <span>Kelas Reguler</span>
            </div>
            <div className="flex items-center gap-1.5">
                <div className="size-2 rounded-full bg-slate-400" />
                <span>Jadwal Kosong</span>
            </div>
        </div>

        <div className="h-[750px] w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 relative overflow-hidden group">
          <style jsx global>{`
            .rbc-calendar { font-family: inherit; }
            .rbc-header { padding: 12px 0 !important; font-weight: 700 !important; font-size: 11px !important; text-transform: uppercase !important; color: #64748b !important; border-bottom: 2px solid #f1f5f9 !important; }
            .rbc-time-view { border: none !important; border-radius: 12px !important; }
            .rbc-timeslot-group { border-bottom: 1px solid #f8fafc !important; min-height: 60px !important; }
            .rbc-time-content { border-top: none !important; }
            .rbc-time-gutter .rbc-timeslot-group { border: none !important; }
            .rbc-label { font-size: 10px !important; font-weight: 600 !important; color: #94a3b8 !important; }
            .rbc-current-time-indicator { background-color: #ef4444 !important; }
            .rbc-event { padding: 0 !important; border: none !important; transition: transform 0.2s ease !important; }
            .rbc-event:hover { transform: scale(1.02) !important; z-index: 50 !important; }
            .rbc-today { background-color: rgba(59, 130, 246, 0.03) !important; }
            .rbc-off-range-bg { background-color: #fcfcfc !important; }
          `}</style>
          
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%" }}
            defaultView={Views.WEEK}
            views={[Views.WEEK, Views.DAY]}
            step={30}
            timeslots={2}
            min={new Date(0, 0, 0, 7, 0, 0)}
            max={new Date(0, 0, 0, 22, 0, 0)}
            onSelectEvent={(event: any) => onSelectEvent(event.resource)}
            components={{
                toolbar: CustomToolbar,
                event: ({ event }: any) => {
                    const item = event.resource as JadwalKerja;
                    const isKosong = event.isKosong;
                    
                    return (
                        <div className={cn(
                            "h-full w-full p-2 flex flex-col gap-1 border-l-4 shadow-sm",
                            isKosong 
                                ? "bg-slate-50 border-slate-300 text-slate-500" 
                                : "bg-blue-50/80 border-blue-500 text-blue-700"
                        )}>
                            <div className="flex items-start justify-between">
                                <span className="font-bold text-[10px] leading-tight truncate">
                                    {event.title}
                                </span>
                                {!isKosong && (
                                    <div className="flex items-center justify-center p-0.5 rounded-full bg-blue-100 text-blue-600">
                                        <Clock className="size-2" />
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex flex-col gap-0.5 mt-auto">
                                <div className="flex items-center gap-1 text-[9px] opacity-80">
                                    <User className="size-2.5" />
                                    <span className="truncate">{item.guru_pengajar?.user?.name || "Anonim"}</span>
                                </div>
                                {item.ruangan_kelas && (
                                    <div className="flex items-center gap-1 text-[9px] opacity-80">
                                        <MapPin className="size-2.5" />
                                        <span className="truncate">{item.ruangan_kelas}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                }
            }}
            eventPropGetter={() => ({
                className: "rounded-lg overflow-hidden",
                style: { backgroundColor: 'transparent' }
            })}
          />
        </div>
    </div>
  );
}

