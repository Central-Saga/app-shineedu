"use client";

import { useState } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, Loader2 } from "lucide-react";
import { enrollmentRepository } from "@/modules/enrollment/infrastructure/enrollment.repository";
import { Enrollment } from "@/modules/enrollment/domain/entities";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface SearchEnrollmentDialogProps {
  onSelect: (enrollment: Enrollment) => void;
  excludeIds?: number[];
}

export function SearchEnrollmentDialog({ onSelect, excludeIds = [] }: SearchEnrollmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // Build query params
      const res = await enrollmentRepository.getEnrollments({ q: val, status: "Aktif", per_page: 20 });
      // Filter out already added ones
      setResults(res.data.filter(e => !excludeIds.includes(e.id)));
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (e: Enrollment) => {
    onSelect(e);
    setOpen(false);
    setQuery("");
    setResults([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 border-dashed">
            <UserPlus className="mr-2 h-4 w-4" /> Cari Murid (Pindahan)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Murid Pindahan</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ketik nama murid..."
              className="pl-9 h-11"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
            />
          </div>
          <ScrollArea className="h-[300px] pr-4">
            {loading && (
                <div className="flex flex-col items-center justify-center h-40 gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-xs text-muted-foreground">Mencari...</p>
                </div>
            )}
            {!loading && results.length === 0 && query.length >= 2 && (
                <div className="flex flex-col items-center justify-center h-40 text-center space-y-2">
                    <p className="text-sm font-medium">Murid tidak ditemukan</p>
                    <p className="text-xs text-muted-foreground px-10">Pastikan nama murid sudah benar dan status enrollmentnya Aktif.</p>
                </div>
            )}
            {!loading && query.length < 2 && (
                <p className="text-center text-xs text-muted-foreground py-20">Ketik minimal 2 karakter untuk mencari.</p>
            )}
            <div className="space-y-2">
              {results.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  className="w-full flex flex-col items-start p-3 rounded-lg border hover:bg-muted/50 hover:border-primary/30 transition-all text-left group"
                  onClick={() => handleSelect(e)}
                >
                  <div className="font-bold text-sm group-hover:text-primary transition-colors">{e.murid?.nama_lengkap}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                    {e.program?.nama} • {e.jenjang?.nama}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono bg-slate-50">
                        {e.kode_enrollment}
                      </Badge>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-100">
                        Aktif
                      </Badge>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
