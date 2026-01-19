import type { Permission } from "./entities";

export const MATRIX_ACTIONS = ["view", "create", "update", "delete", "manage"] as const;
export type MatrixAction = (typeof MATRIX_ACTIONS)[number];

export function getActions(): readonly MatrixAction[] {
  return MATRIX_ACTIONS;
}

export function getModulesFromPermissions(permissions: Permission[]): string[] {
  const set = new Set<string>();
  for (const p of permissions) {
    const i = p.name.indexOf(".");
    if (i > 0 && i < p.name.length - 1) {
      set.add(p.name.slice(0, i));
    }
  }
  return [...set].sort();
}

export interface PermissionMatrix {
  modules: string[];
  actions: readonly MatrixAction[];
  hasPermission(module: string, action: string): boolean;
  getPermissionName(module: string, action: string): string | null;
}

/**
 * Build matrix dari master permissions.
 * hasPermission(module, action) = ada permission "module.action" di master.
 * getPermissionName(module, action) = "module.action" jika ada, else null.
 */
export function buildMatrix(master: Permission[]): PermissionMatrix {
  const set = new Set(master.map((p) => p.name));
  const modules = getModulesFromPermissions(master);
  const actions = getActions();

  function getPermissionName(module: string, action: string): string | null {
    const name = `${module}.${action}`;
    return set.has(name) ? name : null;
  }

  function hasPermission(module: string, action: string): boolean {
    return getPermissionName(module, action) != null;
  }

  return { modules, actions, hasPermission, getPermissionName };
}
