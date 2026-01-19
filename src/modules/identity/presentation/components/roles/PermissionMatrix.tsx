"use client";

import { useMemo, useState } from "react";
import { buildMatrix, getActions } from "../../../domain/permission-matrix";
import type { Permission } from "../../../domain/entities";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface PermissionMatrixProps {
  masterPermissions: Permission[];
  selectedPermissions: string[];
  onChange: (selected: string[]) => void;
  disabled?: boolean;
}

export function PermissionMatrix({
  masterPermissions,
  selectedPermissions,
  onChange,
  disabled = false,
}: PermissionMatrixProps) {
  const [search, setSearch] = useState("");

  const matrix = useMemo(
    () => buildMatrix(masterPermissions),
    [masterPermissions]
  );
  const actions = getActions();
  const selectedSet = useSet(selectedPermissions);

  const filteredModules = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return matrix.modules;
    return matrix.modules.filter((m) => m.toLowerCase().includes(q));
  }, [matrix.modules, search]);

  function add(names: string[]) {
    const next = new Set(selectedPermissions);
    names.forEach((n) => next.add(n));
    onChange([...next]);
  }

  function remove(names: string[]) {
    const set = new Set(names);
    onChange(selectedPermissions.filter((p) => !set.has(p)));
  }

  function toggle(name: string) {
    if (selectedSet.has(name)) remove([name]);
    else add([name]);
  }

  // Row: all permission names for this module that exist in master
  function getRowNames(module: string): string[] {
    return actions
      .map((a) => matrix.getPermissionName(module, a))
      .filter((n): n is string => n != null);
  }

  // Column: all permission names for this action across filtered modules
  function getColumnNames(action: string): string[] {
    return filteredModules
      .map((m) => matrix.getPermissionName(m, action))
      .filter((n): n is string => n != null);
  }

  const allMasterNames = useMemo(
    () => masterPermissions.map((p) => p.name),
    [masterPermissions]
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Cari module…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => add(allMasterNames)}
            disabled={disabled}
          >
            Select All
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange([])}
            disabled={disabled}
          >
            Clear All
          </Button>
        </div>
      </div>

      <ScrollArea className="w-full whitespace-nowrap rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[140px]">Module</TableHead>
              {actions.map((action) => (
                <TableHead key={action} className="text-center">
                  <div className="flex flex-col gap-1">
                    <span className="capitalize">{action}</span>
                    {!disabled && (
                      <div className="flex justify-center gap-1 text-xs font-normal">
                        <button
                          type="button"
                          className="text-primary hover:underline"
                          onClick={() => add(getColumnNames(action))}
                        >
                          All
                        </button>
                        <span>|</span>
                        <button
                          type="button"
                          className="text-muted-foreground hover:underline"
                          onClick={() => remove(getColumnNames(action))}
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredModules.map((module) => {
              const rowNames = getRowNames(module);
              return (
                <TableRow key={module}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-1">
                      <span className="capitalize">{module}</span>
                      {!disabled && (
                        <div className="flex gap-1 text-xs font-normal">
                          <button
                            type="button"
                            className="text-primary hover:underline"
                            onClick={() => add(rowNames)}
                          >
                            All
                          </button>
                          <span>|</span>
                          <button
                            type="button"
                            className="text-muted-foreground hover:underline"
                            onClick={() => remove(rowNames)}
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  {actions.map((action) => {
                    const name = matrix.getPermissionName(module, action);
                    if (!name) return <TableCell key={action} />;
                    return (
                      <TableCell key={action} className="text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={selectedSet.has(name)}
                            onCheckedChange={() => toggle(name)}
                            disabled={disabled}
                          />
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

function useSet(arr: string[]): Set<string> {
  return useMemo(() => new Set(arr), [arr]);
}
