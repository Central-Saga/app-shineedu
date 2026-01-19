import type { User } from "./entities";

export type PermissionName = string;

/**
 * Flatten permissions dari user.roles[].permissions[].name.
 * User hanya 1 role di UI, tapi API mengembalikan roles: [] — kita merge semua.
 */
export function flattenPermissions(user: User): string[] {
  const names: string[] = [];
  if (!user.roles) return names;
  for (const role of user.roles) {
    if (role.permissions) {
      for (const p of role.permissions) {
        if (p.name) names.push(p.name);
      }
    }
  }
  return [...new Set(names)];
}

/**
 * Parse "module.action" menjadi { module, action }.
 */
export function parseModuleAction(
  name: string
): { module: string; action: string } | null {
  const i = name.indexOf(".");
  if (i <= 0 || i >= name.length - 1) return null;
  return { module: name.slice(0, i), action: name.slice(i + 1) };
}
