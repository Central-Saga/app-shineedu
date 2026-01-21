"use client";

import { AppPagination } from "@/components/ui/pagination";

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
  return <AppPagination meta={meta} onPageChange={onPageChange} />;
}
