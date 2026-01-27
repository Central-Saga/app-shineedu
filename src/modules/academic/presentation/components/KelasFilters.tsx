
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface Option {
    id: number;
    nama: string;
}

interface KelasFiltersProps {
    programs: Option[];
    jenjangs: Option[];
}

export function KelasFilters({ programs, jenjangs }: KelasFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [programId, setProgramId] = useState(searchParams.get("program_id") || "all");
  const [jenjangId, setJenjangId] = useState(searchParams.get("jenjang_id") || "all");
  const [tipeKelas, setTipeKelas] = useState(searchParams.get("tipe_kelas") || "all");

  const updateParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== 'page') {
        params.set('page', '1');
    }
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  // Debounce search
  useEffect(() => {
      const timer = setTimeout(() => {
          if (q !== (searchParams.get("q") || "")) {
              updateParam("q", q);
          }
      }, 500);
      return () => clearTimeout(timer);
  }, [q, searchParams, updateParam]);

  const handleClear = () => {
      setQ("");
      setStatus("all");
      setProgramId("all");
      setJenjangId("all");
      setTipeKelas("all");
      router.push("?");
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center py-4">
      <Input
        placeholder="Cari kelas..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="h-8 w-[150px] lg:w-[250px]"
      />
      
      <Select value={status} onValueChange={(val) => { setStatus(val); updateParam("status", val); }}>
        <SelectTrigger className="h-8 w-[130px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Status</SelectItem>
          <SelectItem value="Aktif">Aktif</SelectItem>
          <SelectItem value="Draft">Draft</SelectItem>
          <SelectItem value="Selesai">Selesai</SelectItem>
          <SelectItem value="Non Aktif">Non Aktif</SelectItem>
        </SelectContent>
      </Select>

       <Select value={programId} onValueChange={(val) => { setProgramId(val); updateParam("program_id", val); }}>
        <SelectTrigger className="h-8 w-[130px]">
          <SelectValue placeholder="Program" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Program</SelectItem>
          {programs?.map(p => (
              <SelectItem key={p.id} value={String(p.id)}>{p.nama}</SelectItem>
          ))}
        </SelectContent>
      </Select>

       <Select value={jenjangId} onValueChange={(val) => { setJenjangId(val); updateParam("jenjang_id", val); }}>
        <SelectTrigger className="h-8 w-[130px]">
          <SelectValue placeholder="Jenjang" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Jenjang</SelectItem>
           {jenjangs?.map(j => (
              <SelectItem key={j.id} value={String(j.id)}>{j.nama}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={tipeKelas} onValueChange={(val) => { setTipeKelas(val); updateParam("tipe_kelas", val); }}>
        <SelectTrigger className="h-8 w-[130px]">
          <SelectValue placeholder="Tipe" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Tipe</SelectItem>
          <SelectItem value="REGULER">Reguler</SelectItem>
          <SelectItem value="PRIVATE">Private</SelectItem>
        </SelectContent>
      </Select>

      {(q || status !== 'all' || programId !== 'all' || jenjangId !== 'all' || tipeKelas !== 'all') && (
        <Button
          variant="ghost"
          onClick={handleClear}
          className="h-8 px-2 lg:px-3"
        >
          Reset
          <X className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
