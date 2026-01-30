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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import type { LandingGalleryItem } from "../../domain/entities";
import { ConfirmDeleteDialog } from "@/shared/presentation/components/ConfirmDeleteDialog";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

interface LandingGalleryTableProps {
  items: LandingGalleryItem[];
  loading: boolean;
  onEdit: (item: LandingGalleryItem) => void;
  onDelete: (item: LandingGalleryItem) => void;
  canUpdate: boolean;
  canDelete: boolean;
}

export function LandingGalleryTable({
  items,
  loading,
  onEdit,
  onDelete,
  canUpdate,
  canDelete,
}: LandingGalleryTableProps) {
  const [deleteItem, setDeleteItem] = useState<LandingGalleryItem | null>(null);

  function imageSrc(item: LandingGalleryItem): string {
    if (item.image_url.startsWith("http")) return item.image_url;
    return `${API_BASE.replace(/\/api\/v2\/?$/, "")}/${item.image_path}`.replace(/\/+/g, "/");
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Memuat gallery...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Belum ada item gallery. Tambah item untuk ditampilkan di halaman gallery landing.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Gambar</TableHead>
              <TableHead>Judul / Alt</TableHead>
              <TableHead>Urutan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="relative h-14 w-14 rounded border bg-muted overflow-hidden">
                    {item.image_url ? (
                      <img
                        src={imageSrc(item)}
                        alt={item.title}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground flex items-center justify-center h-full">-</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>{item.title}</TableCell>
                <TableCell>{item.sort_order ?? "-"}</TableCell>
                <TableCell>
                  <Badge variant={item.is_active ? "default" : "secondary"}>
                    {item.is_active ? "Aktif" : "Nonaktif"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canUpdate && (
                        <DropdownMenuItem onClick={() => onEdit(item)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {canDelete && (
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteItem(item)}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Hapus
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
      <ConfirmDeleteDialog
        isOpen={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        onConfirm={() => {
          if (deleteItem) {
            onDelete(deleteItem);
            setDeleteItem(null);
          }
        }}
        title="Hapus item gallery?"
        description="Item ini akan dihapus dari gallery landing. Tindakan tidak dapat dibatalkan."
      />
    </>
  );
}
