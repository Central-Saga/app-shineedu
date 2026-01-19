import {
  get,
  getPaginated,
  post,
  put,
  del,
} from "@/shared/infrastructure/api/httpClient";
import type { PaginatedMeta } from "@/shared/domain/types";
import type { Role, Permission, IdentityUser } from "../domain/entities";

// Roles
export async function listRoles(): Promise<Role[]> {
  const data = await get<Role[]>("roles");
  return (data ?? []) as Role[];
}

export async function createRole(payload: {
  name: string;
  permissions?: string[];
}): Promise<Role> {
  return post<Role>("roles", payload) as Promise<Role>;
}

export async function updateRole(
  id: number,
  payload: { name: string }
): Promise<Role> {
  return put<Role>(`roles/${id}`, payload) as Promise<Role>;
}

export async function deleteRole(id: number): Promise<void> {
  await del(`roles/${id}`);
}

export async function syncRolePermissions(
  id: number,
  permissions: string[]
): Promise<Role> {
  return put<Role>(`roles/${id}/permissions`, { permissions }) as Promise<Role>;
}

// Users
export async function listUsers(
  page: number
): Promise<{ data: IdentityUser[]; meta: PaginatedMeta }> {
  return getPaginated<IdentityUser[]>(`users?page=${page}`);
}

export async function createUser(payload: {
  name: string;
  email: string;
  password: string;
  status: string;
  role: string;
}): Promise<IdentityUser> {
  return post<IdentityUser>("users", payload) as Promise<IdentityUser>;
}

export async function updateUser(
  id: number,
  payload: { name?: string; email?: string; status?: string; password?: string }
): Promise<IdentityUser> {
  return put<IdentityUser>(`users/${id}`, payload) as Promise<IdentityUser>;
}

export async function deleteUser(id: number): Promise<void> {
  await del(`users/${id}`);
}

export async function updateUserRole(
  id: number,
  roleName: string
): Promise<IdentityUser> {
  return put<IdentityUser>(`users/${id}/role`, { role: roleName }) as Promise<IdentityUser>;
}

// Permissions
export async function listPermissions(): Promise<Permission[]> {
  const data = await get<Permission[]>("permissions");
  return (data ?? []) as Permission[];
}
