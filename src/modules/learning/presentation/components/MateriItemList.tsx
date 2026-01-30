"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { materiRepository } from "@/modules/learning/infrastructure/materi.repository";
import type { MateriModulItem } from "@/modules/learning/domain/entities";
import { toast } from "sonner";
import { 
  Plus, 
  FileText, 
  Link as LinkIcon,
  Pencil,
  Trash2,
  Download,
  Eye,
  EyeOff
} from "lucide-react";
import { MateriItemForm } from "./MateriItemForm";
import { ConfirmDeleteDialog } from "@/shared/presentation/components/ConfirmDeleteDialog";
import { authStore } from "@/modules/auth/infrastructure/auth.store";

interface MateriItemListProps {
  modulId: number;
}

export function MateriItemList({ modulId }: MateriItemListProps) {
  const [items, setItems] = useState<MateriModulItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingItem, setEditingItem] = useState<MateriModulItem | undefined>();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const canCreate = authStore.hasPermission("materials.create");
  const canUpdate = authStore.hasPermission("materials.update");
  const canDelete = authStore.hasPermission("materials.delete");

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await materiRepository.getItems(modulId);
      setItems(data);
    } catch (error) {
      console.error("Error fetching items:", error);
      toast.error("Gagal memuat item materi");
    } finally {
      setLoading(false);
    }
  }, [modulId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAdd = () => {
    setEditingItem(undefined);
    setShowEditor(true);
  };

  const handleEdit = (item: MateriModulItem) => {
    setEditingItem(item);
    setShowEditor(true);
  };

  const handleSave = async () => {
    setShowEditor(false);
    setEditingItem(undefined);
    await fetchItems();
  };

  const handleCancel = () => {
    setShowEditor(false);
    setEditingItem(undefined);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await materiRepository.deleteItem(deleteId);
      toast.success("Item berhasil dihapus");
      await fetchItems();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Gagal menghapus item");
    } finally {
      setDeleteId(null);
    }
  };

  const handleToggleStatus = async (itemId: number) => {
    try {
      await materiRepository.toggleItemStatus(itemId);
      toast.success("Status item berhasil diubah");
      await fetchItems();
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Gagal mengubah status item");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "FILE":
        return FileText;
      case "URL":
        return LinkIcon;
      default:
        return FileText;
    }
  };

  if (showEditor) {
    return (
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-lg">
            {editingItem ? "Edit Item Materi" : "Tambah Item Materi"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <MateriItemForm
            modulId={modulId}
            item={editingItem}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Item Materi</CardTitle>
            {canCreate && (
              <Button onClick={handleAdd} size="sm">
                <Plus className="size-4 mr-2" />
                Tambah Item
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="size-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Belum ada item materi</p>
              {canCreate && (
                <Button onClick={handleAdd} variant="outline" size="sm" className="mt-4">
                  <Plus className="size-4 mr-2" />
                  Tambah Item Pertama
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => {
                const Icon = getIcon(item.type);
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-center size-10 rounded-lg bg-slate-100 text-slate-600 shrink-0">
                      <Icon className="size-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">#{index + 1}</span>
                        <h4 className="font-semibold text-sm truncate">{item.title}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {item.type}
                        </Badge>
                        <Badge 
                          variant={item.is_active ? "outline" : "secondary"}
                          className={item.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-xs" : "text-xs"}
                        >
                          {item.is_active ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {canUpdate && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleStatus(item.id)}
                            title={item.is_active ? "Nonaktifkan" : "Aktifkan"}
                          >
                            {item.is_active ? (
                              <EyeOff className="size-4" />
                            ) : (
                              <Eye className="size-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(item)}
                            title="Edit"
                          >
                            <Pencil className="size-4" />
                          </Button>
                        </>
                      )}
                      {item.type === "FILE" && item.file_path && (
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          title="Download"
                        >
                          <a href={`${process.env.NEXT_PUBLIC_STORAGE_URL || 'https://api.shineeducationbali.com/storage'}/${item.file_path}`} download target="_blank" rel="noopener noreferrer">
                            <Download className="size-4" />
                          </a>
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(item.id)}
                          title="Hapus"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        isOpen={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Item Materi"
        description="Apakah Anda yakin ingin menghapus item ini? Tindakan ini tidak dapat dibatalkan."
      />
    </>
  );
}
