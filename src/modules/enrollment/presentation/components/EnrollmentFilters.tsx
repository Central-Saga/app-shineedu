"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
// import { useDebouncedCallback } from "use-debounce"; 

export function EnrollmentFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") || "");
  const [debouncedQ, setDebouncedQ] = useState(q);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      // Reset page when filtering
      if (name !== "page") {
        params.set("page", "1");
      }
      return params.toString();
    },
    [searchParams]
  );

  // Debounce logic
  useEffect(() => {
    const handler = setTimeout(() => {
        setDebouncedQ(q);
    }, 300);
    return () => clearTimeout(handler);
  }, [q]);

  // Effect to push to router when debounced value changes
  useEffect(() => {
      // Avoid pushing if it matches current param (prevent potential loop or double push if easy)
      const currentQ = searchParams.get("q") || "";
      if (debouncedQ !== currentQ) {
           router.push(`${pathname}?${createQueryString("q", debouncedQ)}`);
      }
  }, [debouncedQ, pathname, searchParams, createQueryString, router]); 

  // Removed useDebouncedCallback

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQ(e.target.value);
  };

  const onStatusChange = (val: string) => {
    const value = val === "ALL" ? "" : val;
    router.push(`${pathname}?${createQueryString("status", value)}`);
  };

  // Add more filters if needed (Program, Jenjang, etc) 
  // For brevity I'll start with Search and Status

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-4">
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Cari Code / Nama Murid..."
          className="pl-8"
          value={q}
          onChange={onSearchChange}
        />
      </div>
      <Select 
        value={searchParams.get("status") || "ALL"} 
        onValueChange={onStatusChange}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Semua Status</SelectItem>
          <SelectItem value="Aktif">Aktif</SelectItem>
          <SelectItem value="Pause">Pause</SelectItem>
          <SelectItem value="Selesai">Selesai</SelectItem>
          <SelectItem value="Cancel">Cancel</SelectItem>
        </SelectContent>
      </Select>
      {/* Reset Button */}
      {(searchParams.get("q") || searchParams.get("status")) && (
        <Button 
          variant="ghost" 
          onClick={() => router.push(pathname)}
          className="px-2 lg:px-3"
        >
          Reset
          <X className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
