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
import type { Blog } from "../../domain/entities";
import { ConfirmDeleteDialog } from "@/shared/presentation/components/ConfirmDeleteDialog";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface BlogTableProps {
  items: Blog[];
  loading: boolean;
  onEdit: (item: Blog) => void;
  onDelete: (item: Blog) => void;
  canUpdate: boolean;
  canDelete: boolean;
}

const CATEGORY_LABEL: Record<string, string> = {
  tips: "Tips",
  travel: "Travel",
  trips: "Trips",
};

export function BlogTable({
  items,
  loading,
  onEdit,
  onDelete,
  canUpdate,
  canDelete,
}: BlogTableProps) {
  const [deleteItem, setDeleteItem] = useState<Blog | null>(null);

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Memuat blog...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Belum ada blog. Tambah blog untuk ditampilkan di halaman landing.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Judul</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium max-w-[280px] truncate">
                  {item.title}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {CATEGORY_LABEL[item.category] ?? item.category}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={item.status === "published" ? "default" : "secondary"}>
                    {item.status === "published" ? "Published" : "Draft"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.author?.name ?? "-"}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {item.created_at
                    ? format(new Date(item.created_at), "d MMM yyyy", { locale: id })
                    : "-"}
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
        title="Hapus blog?"
        description="Blog ini akan dihapus beserta semua gambar. Tindakan tidak dapat dibatalkan."
      />
    </>
  );
}
