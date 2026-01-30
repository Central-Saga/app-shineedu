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
import { StatusBadge, DueBadge } from "./StatusBadge";
import { assignmentRepository } from "@/modules/learning/infrastructure/assignment.repository";
import type { Assignment } from "@/modules/learning/domain/entities";
import type { PaginatedMeta } from "@/shared/domain/types";
import { Plus, Search, ClipboardList, Eye } from "lucide-react";

export function AssignmentTable() {
  const router = useRouter();
  const [data, setData] = useState<Assignment[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta>({
    current_page: 1,
    per_page: 15,
    total: 0,
    last_page: 1,
    from: null,
    to: null,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, per_page: 15 };
      if (search) params.q = search;
      if (status && status !== "all") params.status = status;

      const result = await assignmentRepository.getList(params);
      setData(result.data);
      setMeta(result.meta);
    } catch {
      toast.error("Gagal memuat data tugas");
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
              placeholder="Cari judul tugas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            Cari
          </Button>
        </form>

        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="ASSIGNED">Ditugaskan</SelectItem>
            <SelectItem value="SUBMITTED">Dikirim</SelectItem>
            <SelectItem value="REVIEWED">Direview</SelectItem>
            <SelectItem value="CLOSED">Ditutup</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={() => router.push("/dashboard/assignments/create")}>
          <Plus className="h-4 w-4 mr-2" />
          Buat Tugas
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Judul</TableHead>
              <TableHead>Murid</TableHead>
              <TableHead>Sesi</TableHead>
              <TableHead>Due</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Submissions</TableHead>
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
                    <ClipboardList className="h-8 w-8" />
                    <p>Belum ada tugas</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>
                    {item.enrollment?.murid?.nama_lengkap || "-"}
                  </TableCell>
                  <TableCell>
                    {item.sesi?.tanggal
                      ? new Date(item.sesi.tanggal).toLocaleDateString("id-ID")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <DueBadge dueAt={item.due_at} isOverdue={item.is_overdue} />
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="text-center">
                    {item.submissions_count ?? 0}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/dashboard/assignments/${item.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <AppPagination meta={meta} onPageChange={setPage} />
    </div>
  );
}

