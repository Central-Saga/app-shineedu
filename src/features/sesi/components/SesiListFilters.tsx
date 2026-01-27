"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, format, startOfMonth, endOfMonth } from "date-fns";
import { id } from "date-fns/locale";

export function SesiListFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (paramsObject: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(paramsObject).forEach(([name, value]) => {
        if (value) {
            params.set(name, value);
        } else {
            params.delete(name);
        }
      });
      // Always reset page when filtering
      if (!Object.keys(paramsObject).includes("page")) { // Unless paging itself
           params.set("page", "1");
      }
      return params.toString();
    },
    [searchParams]
  );

  const currentFrom = searchParams.get("from") || format(startOfMonth(new Date()), "yyyy-MM-dd");
  const currentDate = new Date(currentFrom);

  const handleMonthChange = (direction: 'prev' | 'next') => {
      const newDate = addMonths(currentDate, direction === 'prev' ? -1 : 1);
      const from = format(startOfMonth(newDate), "yyyy-MM-dd");
      const to = format(endOfMonth(newDate), "yyyy-MM-dd");
      
      router.push(`${pathname}?${createQueryString({ from, to })}`);
  };

  const currentMonthLabel = format(currentDate, "MMMM yyyy", { locale: id });

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-4 justify-between items-center bg-muted/20 p-2 rounded-lg">
      <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => handleMonthChange('prev')}>
              <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold min-w-[140px] text-center">{currentMonthLabel}</span>
          <Button variant="outline" size="icon" onClick={() => handleMonthChange('next')}>
              <ChevronRight className="h-4 w-4" />
          </Button>
      </div>

      <div className="flex gap-2">
        <Select 
            value={searchParams.get("status_sesi") || "ALL"} 
            onValueChange={(val) => {
                const value = val === "ALL" ? null : val;
                router.push(`${pathname}?${createQueryString({ status_sesi: value })}`);
            }}
        >
            <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status Sesi" />
            </SelectTrigger>
            <SelectContent>
            <SelectItem value="ALL">Semua Status</SelectItem>
            <SelectItem value="TERJADWAL">Terjadwal</SelectItem>
            <SelectItem value="BERJALAN">Berjalan</SelectItem>
            <SelectItem value="SELESAI">Selesai</SelectItem>
            <SelectItem value="BATAL">Batal</SelectItem>
            <SelectItem value="LIBUR">Libur</SelectItem>
            </SelectContent>
        </Select>
      </div>
    </div>
  );
}
