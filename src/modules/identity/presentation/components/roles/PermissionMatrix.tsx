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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { CheckSquare, Square } from "lucide-react";

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
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  const matrix = useMemo(
    () => buildMatrix(masterPermissions),
    [masterPermissions]
  );
  const actions = getActions();
  const selectedSet = useSet(selectedPermissions);

  const filteredModules = useMemo(() => {
    let list = matrix.modules;
    if (showSelectedOnly) {
      list = list.filter((m) =>
        actions.some((a) => {
          const n = matrix.getPermissionName(m, a);
          return n != null && selectedSet.has(n);
        })
      );
    }
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((m) => m.toLowerCase().includes(q));
    return list;
  }, [matrix.modules, matrix, actions, search, showSelectedOnly, selectedSet]);

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

  function getRowNames(module: string): string[] {
    return actions
      .map((a) => matrix.getPermissionName(module, a))
      .filter((n): n is string => n != null);
  }

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Cari module…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <span className="text-sm text-slate-600">
            Selected: {selectedPermissions.length}
          </span>
          <div className="flex items-center gap-2">
            <Switch
              id="show-selected-only"
              checked={showSelectedOnly}
              onCheckedChange={setShowSelectedOnly}
            />
            <Label
              htmlFor="show-selected-only"
              className="cursor-pointer text-sm text-slate-600"
            >
              Show selected only
            </Label>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => add(allMasterNames)}
            disabled={disabled}
          >
            <CheckSquare className="mr-1.5 size-4" />
            Select All
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange([])}
            disabled={disabled}
          >
            <Square className="mr-1.5 size-4" />
            Clear All
          </Button>
        </div>
      </div>

      <ScrollArea className="max-h-[70vh] w-full whitespace-nowrap rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 top-0 z-20 min-w-[140px] bg-slate-50">
                Module
              </TableHead>
              {actions.map((action) => (
                <TableHead
                  key={action}
                  className="sticky top-0 z-10 bg-slate-50 text-center"
                >
                  <div className="flex flex-col gap-1">
                    <span className="capitalize">{action}</span>
                    {!disabled && (
                      <div className="flex justify-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => add(getColumnNames(action))}
                        >
                          All
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs text-muted-foreground"
                          onClick={() => remove(getColumnNames(action))}
                        >
                          Clear
                        </Button>
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
                  <TableCell className="sticky left-0 z-10 bg-background font-medium">
                    <div className="flex flex-col gap-1">
                      <span className="capitalize">{module}</span>
                      {!disabled && (
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => add(rowNames)}
                          >
                            All
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs text-muted-foreground"
                            onClick={() => remove(rowNames)}
                          >
                            Clear
                          </Button>
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
