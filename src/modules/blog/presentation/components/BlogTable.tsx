"use client";

import { useState } from "react";
import Image from "next/image";
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
import { MoreHorizontal, Pencil, Trash, Eye, ImageOff } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { BlogPost } from "../../domain/entities";

interface BlogTableProps {
  items: BlogPost[];
  loading: boolean;
  onView: (item: BlogPost) => void;
  onEdit: (item: BlogPost) => void;
  onDelete: (item: BlogPost) => void;
  canUpdate: boolean;
  canDelete: boolean;
}

export function BlogTable({
  items,
  loading,
  onView,
  onEdit,
  onDelete,
  canUpdate,
  canDelete,
}: BlogTableProps) {
  const [deleteData, setDeleteData] = useState<BlogPost | null>(null);

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
        Tidak ada artikel blog ditemukan.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <div className="min-w-[700px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[72px]">Gambar</TableHead>
                <TableHead>Judul</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Penulis</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="w-[72px] p-2">
                    {item.featured_image_url ? (
                      <div className="relative h-12 w-12 overflow-hidden rounded border bg-muted">
                        <Image
                          src={item.featured_image_url}
                          alt=""
                          fill
                          className="object-cover"
                          unoptimized
                          sizes="48px"
                        />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded border bg-muted text-muted-foreground">
                        <ImageOff className="h-5 w-5" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.category ?? "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={item.status === "published" ? "default" : "secondary"}
                      className={item.status === "published" ? "bg-emerald-600" : ""}
                    >
                      {item.status === "published" ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.author?.name ?? "-"}
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
        title="Hapus Artikel Blog?"
        description={`Yakin menghapus artikel "${deleteData?.title ?? ""}"?`}
      />
    </>
  );
}
