"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDeleteDialog } from "@/shared/presentation/components/ConfirmDeleteDialog";
import { materiRepository } from "@/modules/learning/infrastructure/materi.repository";
import type { MateriModulItem } from "@/modules/learning/domain/entities";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Link as LinkIcon,
  File,
  Loader2,
  Upload,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const typeIcons: Record<string, React.ReactNode> = {
  FILE: <File className="h-4 w-4" />,
  URL: <LinkIcon className="h-4 w-4" />,
};

const typeLabels: Record<string, string> = {
  FILE: "File",
  URL: "URL",
};

interface MateriItemEditorProps {
  modulId: number;
  items: MateriModulItem[];
  onItemsChange: () => void;
}

interface ItemFormData {
  type: "FILE" | "URL";
  title: string;
  url: string;
  file: File | null;
}

export function MateriItemEditor({
  modulId,
  items,
  onItemsChange,
}: MateriItemEditorProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MateriModulItem | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [formData, setFormData] = useState<ItemFormData>({
    type: "FILE",
    title: "",
    url: "",
    file: null,
  });

  const openAddDialog = () => {
    setEditingItem(null);
    setFormData({ type: "FILE", title: "", url: "", file: null });
    setDialogOpen(true);
  };

  const openEditDialog = (item: MateriModulItem) => {
    setEditingItem(item);
    setFormData({
      type: item.type as "FILE" | "URL",
      title: item.title,
      url: item.url || "",
      file: null,
    });
    setDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedExtensions = [
        'doc', 'docx', 'xls', 'xlsx', 'pdf', 'ppt', 'pptx',
        'jpg', 'jpeg', 'png', 'gif', 'zip'
      ];
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      if (!extension || !allowedExtensions.includes(extension)) {
        toast.error("Format file tidak didukung. Gunakan: Word, Excel, PDF, PowerPoint, Gambar (JPG/PNG/GIF), atau ZIP");
        e.target.value = '';
        return;
      }

      // Validate file size (50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 50MB");
        e.target.value = '';
        return;
      }

      setFormData({ ...formData, file });
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error("Judul item wajib diisi");
      return;
    }

    if (formData.type === "URL" && !formData.url.trim()) {
      toast.error("URL wajib diisi untuk tipe URL");
      return;
    }

    if (formData.type === "FILE" && !editingItem && !formData.file) {
      toast.error("File wajib diupload untuk tipe FILE");
      return;
    }

    setSaving(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("type", formData.type);
      formDataToSend.append("title", formData.title);
      
      if (formData.type === "URL") {
        formDataToSend.append("url", formData.url);
      }
      
      if (formData.type === "FILE" && formData.file) {
        formDataToSend.append("file", formData.file);
      }

      if (editingItem) {
        await materiRepository.updateItem(editingItem.id, formDataToSend);
        toast.success("Item berhasil diperbarui");
      } else {
        await materiRepository.addItem(modulId, formDataToSend);
        toast.success("Item berhasil ditambahkan");
      }

      setDialogOpen(false);
      onItemsChange();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Gagal menyimpan item";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItemId) return;
    try {
      await materiRepository.deleteItem(deleteItemId);
      toast.success("Item berhasil dihapus");
      onItemsChange();
    } catch {
      toast.error("Gagal menghapus item");
    } finally {
      setDeleteItemId(null);
    }
  };

  const handleToggleStatus = async (itemId: number) => {
    setTogglingId(itemId);
    try {
      await materiRepository.toggleItemStatus(itemId);
      toast.success("Status berhasil diubah");
      onItemsChange();
    } catch {
      toast.error("Gagal mengubah status");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Item Materi</CardTitle>
        <Button size="sm" onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Item
        </Button>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <File className="h-8 w-8 mx-auto mb-2" />
            <p>Belum ada item. Klik &quot;Tambah Item&quot; untuk menambahkan.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                <span className="text-muted-foreground">{index + 1}.</span>
                <div className="flex items-center gap-2 flex-1">
                  {typeIcons[item.type]}
                  <span className="font-medium">{item.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {typeLabels[item.type]}
                  </Badge>
                  {item.type === "URL" && item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {!item.is_active && (
                    <Badge variant="secondary" className="text-xs">
                      Nonaktif
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={item.is_active}
                    onCheckedChange={() => handleToggleStatus(item.id)}
                    disabled={togglingId === item.id}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(item)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteItemId(item.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Item" : "Tambah Item"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="mb-2">Tipe *</Label>
              <Select
                value={formData.type}
                onValueChange={(v) =>
                  setFormData({ ...formData, type: v as "FILE" | "URL", file: null, url: "" })
                }
                disabled={!!editingItem}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        {typeIcons[value]}
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editingItem && (
                <p className="text-xs text-muted-foreground mt-1">
                  Tipe tidak dapat diubah saat edit
                </p>
              )}
            </div>

            <div>
              <Label className="mb-2">Judul *</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Judul item"
              />
            </div>

            {formData.type === "URL" && (
              <div>
                <Label className="mb-2">URL *</Label>
                <Input
                  type="url"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  placeholder="https://example.com"
                />
              </div>
            )}

            {formData.type === "FILE" && (
              <div>
                <Label className="mb-2">
                  File {!editingItem && "*"}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    onChange={handleFileChange}
                    accept=".doc,.docx,.xls,.xlsx,.pdf,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.zip"
                  />
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Format: Word, Excel, PDF, PowerPoint, Gambar, ZIP (Max 50MB)
                </p>
                {editingItem && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Kosongkan jika tidak ingin mengubah file
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDeleteDialog
        isOpen={deleteItemId !== null}
        onOpenChange={(open) => !open && setDeleteItemId(null)}
        onConfirm={handleDelete}
        title="Hapus Item"
        description="Yakin ingin menghapus item ini?"
      />
    </Card>
  );
}
