"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface MonthYearSelectProps {
    defaultMonth: number;
    defaultYear: number;
    className?: string;
}

export function MonthYearSelect({ defaultMonth, defaultYear, className }: MonthYearSelectProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const months = [
        { value: 1, label: "Januari" },
        { value: 2, label: "Februari" },
        { value: 3, label: "Maret" },
        { value: 4, label: "April" },
        { value: 5, label: "Mei" },
        { value: 6, label: "Juni" },
        { value: 7, label: "Juli" },
        { value: 8, label: "Agustus" },
        { value: 9, label: "September" },
        { value: 10, label: "Oktober" },
        { value: 11, label: "November" },
        { value: 12, label: "Desember" },
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i); // 5 years back, 5 years forward

    const updateParams = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set(key, value);
        params.set("page", "1"); // Reset page on filter change
        router.push(`${pathname}?${params.toString()}`);
    }

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <Select 
                defaultValue={defaultMonth.toString()} 
                onValueChange={(v) => updateParams("bulan", v)}
            >
                <SelectTrigger className="w-[140px] h-9 rounded-lg">
                    <SelectValue placeholder="Bulan" />
                </SelectTrigger>
                <SelectContent>
                    {months.map((m) => (
                        <SelectItem key={m.value} value={m.value.toString()}>
                            {m.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select 
                defaultValue={defaultYear.toString()} 
                onValueChange={(v) => updateParams("tahun", v)}
            >
                <SelectTrigger className="w-[100px] h-9 rounded-lg">
                    <SelectValue placeholder="Tahun" />
                </SelectTrigger>
                <SelectContent>
                    {years.map((y) => (
                        <SelectItem key={y} value={y.toString()}>
                            {y}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
