"use client";

import { cn } from "@/lib/utils";
import type { Role } from "../../../domain/entities";

interface RoleListProps {
  roles: Role[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function RoleList({ roles, selectedId, onSelect }: RoleListProps) {
  return (
    <div className="space-y-1">
      {roles.length === 0 ? (
        <p className="px-3 py-4 text-sm text-muted-foreground">
          Belum ada role.
        </p>
      ) : (
        roles.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => onSelect(r.id)}
            className={cn(
              "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
              selectedId === r.id
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent/50"
            )}
          >
            {r.name}
          </button>
        ))
      )}
    </div>
  );
}
