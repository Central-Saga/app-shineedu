import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("flex justify-end", className)}
    {...props}
  />
);
Pagination.displayName = "Pagination";

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-2", className)}
    {...props}
  />
));
PaginationContent.displayName = "PaginationContent";

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
));
PaginationItem.displayName = "PaginationItem";

type PaginationLinkProps = {
  isActive?: boolean;
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg";
} & React.ComponentProps<typeof Link>;

const PaginationLink = ({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) => (
  <Link
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size,
      }),
      "shrink-0",
      className
    )}
    {...props}
  />
);
PaginationLink.displayName = "PaginationLink";

const PaginationPrevious = ({
  className,
  href = "#",
  onClick,
  disabled,
  ...props
}: React.ComponentProps<typeof PaginationLink> & { disabled?: boolean }) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn("gap-1 pl-2.5", disabled && "pointer-events-none opacity-50", className)}
    href={disabled ? "#" : href}
    onClick={disabled ? undefined : onClick}
    {...props}
  >
    <ChevronLeft className="size-4" />
    <span>Sebelumnya</span>
  </PaginationLink>
);
PaginationPrevious.displayName = "PaginationPrevious";

const PaginationNext = ({
  className,
  href = "#",
  onClick,
  disabled,
  ...props
}: React.ComponentProps<typeof PaginationLink> & { disabled?: boolean }) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn("gap-1 pr-2.5", disabled && "pointer-events-none opacity-50", className)}
    href={disabled ? "#" : href}
    onClick={disabled ? undefined : onClick}
    {...props}
  >
    <span>Selanjutnya</span>
    <ChevronRight className="size-4" />
  </PaginationLink>
);
PaginationNext.displayName = "PaginationNext";

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="size-4" />
  </span>
);
PaginationEllipsis.displayName = "PaginationEllipsis";

/**
 * Build array of page numbers and 'ellipsis' for pagination UI.
 * Example: (1, 10, 5) => [1, 'ellipsis', 4, 5, 6, 'ellipsis', 10]
 */
export function buildPaginationItems(
  current_page: number,
  last_page: number,
  windowSize = 5
): (number | "ellipsis")[] {
  if (last_page <= 1) return [];
  if (last_page <= windowSize) {
    return Array.from({ length: last_page }, (_, i) => i + 1);
  }
  const half = Math.floor(windowSize / 2);
  let start = Math.max(1, current_page - half);
  const end = Math.min(last_page, start + windowSize - 1);
  if (end - start + 1 < windowSize) {
    start = Math.max(1, end - windowSize + 1);
  }
  const items: (number | "ellipsis")[] = [];
  if (start > 1) {
    items.push(1);
    if (start > 2) items.push("ellipsis");
  }
  for (let i = start; i <= end; i++) items.push(i);
  if (end < last_page) {
    if (end < last_page - 1) items.push("ellipsis");
    items.push(last_page);
  }
  return items;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  total: number;
  from: number | null;
  to: number | null;
  per_page?: number;
}

export interface AppPaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  /** Optional: build href for a page (e.g. for SEO). If not provided, # is used and click is handled via onPageChange only. */
  buildPageHref?: (page: number) => string;
  window?: number;
}

export function AppPagination({
  meta,
  onPageChange,
  buildPageHref,
  window: windowSize = 5,
}: AppPaginationProps) {
  const { current_page, last_page, total, from, to } = meta;
  const canPrev = current_page > 1;
  const canNext = current_page < last_page;
  const items = buildPaginationItems(current_page, last_page, windowSize);

  const handleClick = (p: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    onPageChange(p);
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground text-sm whitespace-nowrap">
        Menampilkan {from ?? 0}–{to ?? 0} dari {total}
      </p>
      {last_page > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={buildPageHref?.(current_page - 1) ?? "#"}
                onClick={handleClick(current_page - 1)}
                disabled={!canPrev}
              />
            </PaginationItem>
            {items.map((it, i) =>
              it === "ellipsis" ? (
                <PaginationItem key={`e-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={it}>
                  <PaginationLink
                    href={buildPageHref?.(it) ?? "#"}
                    onClick={handleClick(it)}
                    isActive={it === current_page}
                  >
                    {it}
                  </PaginationLink>
                </PaginationItem>
              )
            )}
            <PaginationItem>
              <PaginationNext
                href={buildPageHref?.(current_page + 1) ?? "#"}
                onClick={handleClick(current_page + 1)}
                disabled={!canNext}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
