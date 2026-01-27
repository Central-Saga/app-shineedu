"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter,
    DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxList,
    ComboboxItem,
    ComboboxTrigger
} from "@/components/ui/combobox";
import { Loader2, MoveHorizontal, Clock } from "lucide-react";
import { id as idLocale } from "date-fns/locale";
import { sesiApi } from "../api/sesi.api";
import { Sesi, AbsensiItem } from "../types";

interface MoveStudentDialogProps {
    sesi: Sesi;
    student: AbsensiItem;
    onSuccess: () => void;
}

export function MoveStudentDialog({ sesi, student, onSuccess }: MoveStudentDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sessions, setSessions] = useState<Sesi[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            // Load sessions for this class
            const loadSessions = async () => {
                try {
                    const res = await sesiApi.getSesiByKelas(sesi.kelas_id, {
                        from: format(new Date(), "yyyy-MM-dd"), // Future/Today
                        per_page: 50
                    });
                    // Filter out current session
                    setSessions(res.data.filter(s => s.id !== sesi.id));
                } catch (error) {
                    console.error("Gagal memuat daftar sesi:", error);
                }
            };
            loadSessions();
        }
    }, [open, sesi.kelas_id, sesi.id]);

    const handleMove = async () => {
        if (!selectedSessionId) {
            toast.error("Pilih sesi tujuan");
            return;
        }

        try {
            setLoading(true);
            await sesiApi.moveAttendance(sesi.id, student.enrollment_id, Number(selectedSessionId));
            toast.success("Murid berhasil dipindahkan");
            setOpen(false);
            onSuccess();
        } catch (error: any) {
            toast.error(error.message || "Gagal memindahkan murid");
        } finally {
            setLoading(false);
        }
    };

    const studentName = student.murid?.nama_lengkap || student.enrollment?.murid?.nama_lengkap || "Murid";
    const selectedSession = sessions.find((s) => String(s.id) === selectedSessionId);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                    <MoveHorizontal className="h-4 w-4 mr-2" /> Pindahkan
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>Pindahkan Sesi Murid</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div>
                        <p className="text-sm font-medium">{studentName}</p>
                        <p className="text-xs text-muted-foreground">Pindahkan murid ini ke sesi lain.</p>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Sesi Tujuan</label>
                        <div className="w-full">
                            <Combobox
                                items={sessions}
                                value={selectedSessionId || ""}
                                onValueChange={(val) => setSelectedSessionId(val as string)}
                            >
                                <ComboboxTrigger className="inline-flex items-center justify-between w-full px-3 py-2 text-sm font-normal text-left transition-colors border rounded-md shadow-sm h-10 border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                    {selectedSessionId && selectedSession ? (
                                        <span className="truncate">
                                            {format(new Date(selectedSession.tanggal), "eeee, dd MMMM yyyy", { locale: idLocale })} - {selectedSession.jam_mulai_plan.slice(0,5)}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">Pilih sesi tujuan...</span>
                                    )}
                                </ComboboxTrigger>
                                <ComboboxContent className="z-50 min-w-[320px] max-w-[450px]">
                                    <ComboboxInput placeholder="Cari tanggal atau hari..." className="w-full" />
                                    <ComboboxEmpty>Sesi tidak ditemukan.</ComboboxEmpty>
                                    <ComboboxList className="max-h-[300px] overflow-y-auto">
                                        {sessions.map((s) => (
                                            <ComboboxItem 
                                                key={s.id} 
                                                value={String(s.id)} 
                                                className="flex flex-col items-start gap-1 py-3 px-4"
                                            >
                                                <span className="font-semibold text-sm">
                                                    {format(new Date(s.tanggal), "eeee, dd MMMM yyyy", { locale: idLocale })}
                                                </span>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    <span>{s.jam_mulai_plan?.slice(0,5) || "-"} - {s.jam_selesai_plan?.slice(0,5) || "-"}</span>
                                                    <span>•</span>
                                                    <span>{s.guru_pengajar?.user?.name || "No Guru"}</span>
                                                </div>
                                            </ComboboxItem>
                                        ))}
                                    </ComboboxList>
                                </ComboboxContent>
                            </Combobox>
                        </div>
                        <p className="text-[10px] text-muted-foreground italic">
                            * Absensi murid di sesi saat ini akan ditandai BATAL (Pindah Jadwal).
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Batal
                    </Button>
                    <Button onClick={handleMove} disabled={loading || !selectedSessionId}>
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Konfirmasi Pindah
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
