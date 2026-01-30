"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteDialog } from "@/shared/presentation/components/ConfirmDeleteDialog";
import { MoreHorizontal, Pencil, Trash, Eye, FileText } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { JobApplication } from "../../domain/entities";

interface JobApplicationTableProps {
  items: JobApplication[];
  loading: boolean;
  onView: (item: JobApplication) => void;
  onEdit: (item: JobApplication) => void;
  onDelete: (item: JobApplication) => void;
  canUpdate: boolean;
  canDelete: boolean;
}

const EXPERIENCE_LABELS: Record<string, string> = {
  "fresh-graduate": "Fresh Graduate",
  "1-2": "1-2 tahun",
  "3-5": "3-5 tahun",
  "5-10": "5-10 tahun",
  "10+": "> 10 tahun",
};

const EDUCATION_LABELS: Record<string, string> = {
  sma: "SMA/SMK",
  d3: "D3",
  s1: "S1",
  s2: "S2",
  s3: "S3",
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 hover:bg-amber-200",
    reviewed: "bg-blue-100 text-blue-700 hover:bg-blue-200",
    shortlisted: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
    rejected: "bg-red-100 text-red-700 hover:bg-red-200",
    hired: "bg-green-100 text-green-700 hover:bg-green-200",
  };
  return (
    <Badge
      className={styles[status] ?? "bg-muted text-muted-foreground"}
      variant="secondary"
    >
      {status}
    </Badge>
  );
}

export function JobApplicationTable({
  items,
  loading,
  onView,
  onEdit,
  onDelete,
  canUpdate,
  canDelete,
}: JobApplicationTableProps) {
  const [deleteData, setDeleteData] = useState<JobApplication | null>(null);

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Memuat data...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Tidak ada lamaran kerja ditemukan.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <div className="min-w-[900px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email / Telepon</TableHead>
                <TableHead>Posisi</TableHead>
                <TableHead>Pengalaman</TableHead>
                <TableHead>Pendidikan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">
                      {item.first_name} {item.last_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{item.email}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.phone}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.position?.title ?? `Posisi #${item.position_id}`}
                    {item.position?.location && (
                      <div className="text-xs text-muted-foreground">
                        {item.position.location}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {EXPERIENCE_LABELS[item.experience] ?? item.experience}
                  </TableCell>
                  <TableCell>
                    {EDUCATION_LABELS[item.education] ?? item.education}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.created_at
                      ? format(new Date(item.created_at), "dd MMM yyyy", {
                          locale: idLocale,
                        })
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onView(item)}>
                          <Eye className="mr-2 h-4 w-4" /> Lihat
                        </DropdownMenuItem>
                        {item.resume_url && (
                          <DropdownMenuItem
                            onClick={() =>
                              window.open(item.resume_url ?? "", "_blank")
                            }
                          >
                            <FileText className="mr-2 h-4 w-4" /> CV
                          </DropdownMenuItem>
                        )}
                        {canUpdate && (
                          <DropdownMenuItem onClick={() => onEdit(item)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                        )}
                        {canDelete && (
                          <DropdownMenuItem
                            onClick={() => setDeleteData(item)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash className="mr-2 h-4 w-4" /> Hapus
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <ConfirmDeleteDialog
        isOpen={!!deleteData}
        onOpenChange={(open) => !open && setDeleteData(null)}
        onConfirm={() => {
          if (deleteData) onDelete(deleteData);
          setDeleteData(null);
        }}
        title="Hapus Lamaran?"
        description={`Yakin menghapus lamaran dari ${deleteData?.first_name ?? ""} ${deleteData?.last_name ?? ""}?`}
      />
    </>
  );
}
