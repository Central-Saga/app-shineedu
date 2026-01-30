"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppPagination } from "@/components/ui/pagination";
import { ConfirmDeleteDialog } from "@/shared/presentation/components/ConfirmDeleteDialog";
import { ActiveBadge } from "./StatusBadge";
import { materiRepository } from "@/modules/learning/infrastructure/materi.repository";
import type { MateriModul } from "@/modules/learning/domain/entities";
import type { PaginatedMeta } from "@/shared/domain/types";
import { Plus, Pencil, Trash2, Search, BookOpen } from "lucide-react";
import { listProgram, listJenjang } from "@/modules/catalog/infrastructure/catalog.repository";

interface MateriModulTableProps {
  onEdit?: (id: number) => void;
}

export function MateriModulTable({ onEdit }: MateriModulTableProps) {
  const router = useRouter();
  const [data, setData] = useState<MateriModul[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta>({
    current_page: 1,
    per_page: 15,
    total: 0,
    last_page: 1,
    from: null,
    to: null,
  });
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [programId, setProgramId] = useState<string>("all");
  const [jenjangId, setJenjangId] = useState<string>("all");
  const [isActive, setIsActive] = useState<string>("all");
  const [page, setPage] = useState(1);

  // Catalog options
  const [programs, setPrograms] = useState<{ id: number; nama: string }[]>([]);
  const [jenjangs, setJenjangs] = useState<{ id: number; nama: string }[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, per_page: 15 };
      if (search) params.q = search;
      if (programId && programId !== "all") params.program_id = programId;
      if (jenjangId && jenjangId !== "all") params.jenjang_id = jenjangId;
      if (isActive && isActive !== "all") params.is_active = isActive === "true";

      const result = await materiRepository.getList(params);
      setData(result.data);
      setMeta(result.meta);
    } catch {
      toast.error("Gagal memuat data materi modul");
    } finally {
      setLoading(false);
    }
  }, [page, search, programId, jenjangId, isActive]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    // Load catalog options
    const loadCatalogs = async () => {
      try {
        const [programRes, jenjangRes] = await Promise.all([
          listProgram({}),
          listJenjang({}),
        ]);
        setPrograms(programRes.items || []);
        setJenjangs(jenjangRes.items || []);
      } catch {
        console.error("Failed to load catalogs");
      }
    };
    loadCatalogs();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await materiRepository.delete(deleteId);
      toast.success("Materi modul berhasil dihapus");
      fetchData();
    } catch (error) {
      toast.error("Gagal menghapus materi modul");
    } finally {
      setDeleteId(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari judul..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            Cari
          </Button>
        </form>

        <Select value={programId} onValueChange={(v) => { setProgramId(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Program" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Program</SelectItem>
            {programs.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={jenjangId} onValueChange={(v) => { setJenjangId(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Jenjang" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Jenjang</SelectItem>
            {jenjangs.map((j) => (
              <SelectItem key={j.id} value={String(j.id)}>
                {j.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={isActive} onValueChange={(v) => { setIsActive(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="true">Aktif</SelectItem>
            <SelectItem value="false">Nonaktif</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={() => router.push("/dashboard/materi-modul/create")}>
          <Plus className="h-4 w-4 mr-2" />
          Buat Modul
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Judul</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Jenjang</TableHead>
              <TableHead className="text-center">Items</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <BookOpen className="h-8 w-8" />
                    <p>Belum ada materi modul</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>{item.program?.nama || "-"}</TableCell>
                  <TableCell>{item.jenjang?.nama || "-"}</TableCell>
                  <TableCell className="text-center">
                    {item.items_count ?? item.items?.length ?? 0}
                  </TableCell>
                  <TableCell className="text-center">
                    <ActiveBadge isActive={item.is_active} />
                  </TableCell>
                  <TableCell>
                    {item.updated_at
                      ? new Date(item.updated_at).toLocaleDateString("id-ID")
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          onEdit
                            ? onEdit(item.id)
                            : router.push(`/dashboard/materi-modul/${item.id}/edit`)
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <AppPagination meta={meta} onPageChange={setPage} />

      {/* Delete Dialog */}
      <ConfirmDeleteDialog
        isOpen={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Materi Modul"
        description="Yakin ingin menghapus materi modul ini? Semua item di dalamnya juga akan dihapus."
      />
    </div>
  );
}
