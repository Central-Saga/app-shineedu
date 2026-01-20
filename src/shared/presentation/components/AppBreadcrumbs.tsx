"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AppBreadcrumbsItem {
  label: string;
  href?: string;
}

interface AppBreadcrumbsProps {
  items: AppBreadcrumbsItem[];
  className?: string;
}

export function AppBreadcrumbs({ items, className }: AppBreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("mb-4 flex items-center gap-1.5 text-sm text-muted-foreground", className)}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && (
              <ChevronRight className="size-4 shrink-0 text-muted-foreground/70" />
            )}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={isLast ? "font-medium text-foreground" : undefined}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
