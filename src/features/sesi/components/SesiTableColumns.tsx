"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Sesi } from "@/features/sesi/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export const getSesiColumns = (kelasId: number): ColumnDef<Sesi>[] => [
  {
    accessorKey: "tanggal",
    header: "Tanggal",
    cell: ({ row }) => {
        try {
            return format(new Date(row.original.tanggal), "eeee, dd MMM yyyy", { locale: id });
        } catch {
            return row.original.tanggal;
        }
    }
  },
  {
    accessorKey: "jam_mulai",
    header: "Jadwal",
    cell: ({ row }) => (
      <div className="text-sm">
      <div className="text-sm">
        {row.original.jam_mulai_plan?.slice(0, 5) || "-"} - {row.original.jam_selesai_plan?.slice(0, 5) || "-"}
      </div>
      </div>
    ),
  },
  {
    accessorKey: "status_sesi",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status_sesi;
      let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
      if (status === "TERJADWAL") variant = "secondary";
      if (status === "BERJALAN") variant = "default";
      if (status === "SELESAI") variant = "default"; // Maybe success color if configured
      if (status === "BATAL") variant = "destructive";
      if (status === "LIBUR") variant = "outline";

      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    accessorKey: "guru",
    header: "Guru",
    cell: ({ row }) => {
        const pengganti = row.original.guru_pengganti;
        const pengajar = row.original.guru_pengajar;
        
        const guruName = pengganti 
            ? `${pengganti.name} (Pengganti)` 
            : pengajar?.name;
        
        return <span className="text-sm">{guruName || "-"}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Button asChild variant="ghost" size="sm">
        <Link href={`/dashboard/kelas/${kelasId}/sesi/${row.original.id}`}>
          Detail <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    ),
  },
];
