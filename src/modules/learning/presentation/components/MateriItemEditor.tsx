"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Video,
  FileText,
  Link as LinkIcon,
  Type,
  HelpCircle,
  File,
  Loader2,
} from "lucide-react";

const typeIcons: Record<string, React.ReactNode> = {
  VIDEO: <Video className="h-4 w-4" />,
  PDF: <FileText className="h-4 w-4" />,
  LINK: <LinkIcon className="h-4 w-4" />,
  TEXT: <Type className="h-4 w-4" />,
  QUIZ: <HelpCircle className="h-4 w-4" />,
  FILE: <File className="h-4 w-4" />,
};

const typeLabels: Record<string, string> = {
  VIDEO: "Video",
  PDF: "PDF",
  LINK: "Link",
  TEXT: "Teks",
  QUIZ: "Quiz",
  FILE: "File",
};

interface MateriItemEditorProps {
  modulId: number;
  items: MateriModulItem[];
  onItemsChange: () => void;
}

interface ItemFormData {
  type: MateriModulItem["type"];
  title: string;
  content: string;
  url: string;
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

  const [formData, setFormData] = useState<ItemFormData>({
    type: "TEXT",
    title: "",
    content: "",
    url: "",
  });

  const openAddDialog = () => {
    setEditingItem(null);
    setFormData({ type: "TEXT", title: "", content: "", url: "" });
    setDialogOpen(true);
  };

  const openEditDialog = (item: MateriModulItem) => {
    setEditingItem(item);
    setFormData({
      type: item.type,
      title: item.title,
      content: item.content || "",
      url: item.url || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error("Judul item wajib diisi");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        type: formData.type,
        title: formData.title,
        content: formData.type === "TEXT" ? formData.content : undefined,
        url: ["VIDEO", "PDF", "LINK"].includes(formData.type) ? formData.url : undefined,
      };

      if (editingItem) {
        await materiRepository.updateItem(editingItem.id, payload);
        toast.success("Item berhasil diperbarui");
      } else {
        await materiRepository.addItem(modulId, payload);
        toast.success("Item berhasil ditambahkan");
      }

      setDialogOpen(false);
      onItemsChange();
    } catch (error) {
      toast.error("Gagal menyimpan item");
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
    } catch (error) {
      toast.error("Gagal menghapus item");
    } finally {
      setDeleteItemId(null);
    }
  };

  const showUrlField = ["VIDEO", "PDF", "LINK"].includes(formData.type);
  const showContentField = formData.type === "TEXT";

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
            <FileText className="h-8 w-8 mx-auto mb-2" />
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
                  <span className="text-xs text-muted-foreground">
                    ({typeLabels[item.type]})
                  </span>
                </div>
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
            ))}
          </div>
        )}
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Item" : "Tambah Item"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tipe</label>
              <Select
                value={formData.type}
                onValueChange={(v) =>
                  setFormData({ ...formData, type: v as MateriModulItem["type"] })
                }
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
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Judul *</label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Judul item"
              />
            </div>

            {showUrlField && (
              <div>
                <label className="text-sm font-medium mb-2 block">URL</label>
                <Input
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
            )}

            {showContentField && (
              <div>
                <label className="text-sm font-medium mb-2 block">Konten</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="Tulis konten teks..."
                  rows={5}
                />
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
