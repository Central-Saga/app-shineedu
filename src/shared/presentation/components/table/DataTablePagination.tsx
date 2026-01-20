"use client";

import { Button } from "@/components/ui/button";

export interface DataTablePaginationMeta {
  current_page: number;
  last_page: number;
  total: number;
  from: number | null;
  to: number | null;
  per_page: number;
}

export interface DataTablePaginationProps {
  meta: DataTablePaginationMeta;
  onPageChange: (page: number) => void;
}

export function DataTablePagination({ meta, onPageChange }: DataTablePaginationProps) {
  const { current_page, last_page, total, from, to } = meta;
  const canPrev = current_page > 1;
  const canNext = current_page < last_page;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground text-sm">
        Menampilkan {from ?? 0}–{to ?? 0} dari {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(current_page - 1)}
          disabled={!canPrev}
        >
          Sebelumnya
        </Button>
        {last_page > 1 && (
          <span className="text-muted-foreground text-sm">
            Halaman {current_page} dari {last_page}
          </span>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(current_page + 1)}
          disabled={!canNext}
        >
          Selanjutnya
        </Button>
      </div>
    </div>
  );
}
