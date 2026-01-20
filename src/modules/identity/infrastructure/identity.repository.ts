import {
  get,
  getResponse,
  post,
  put,
  del,
  DEFAULT_META,
} from "@/shared/infrastructure/api/httpClient";
import { buildQuery } from "@/shared/lib/buildQuery";
import type { PaginatedMeta } from "@/shared/domain/types";
import type { Role, Permission, IdentityUser } from "../domain/entities";

export interface ListRolesParams {
  page?: number;
  per_page?: number;
  q?: string;
  sort_by?: "name" | "created_at" | "updated_at";
  sort_dir?: "asc" | "desc";
}

export interface ListUsersParams {
  page?: number;
  per_page?: number;
  q?: string;
  status?: "Aktif" | "Non Aktif";
  role?: string;
  sort_by?: "name" | "email" | "status" | "created_at" | "updated_at";
  sort_dir?: "asc" | "desc";
}

// Roles
export async function listRoles(
  params?: ListRolesParams
): Promise<{ items: Role[]; meta: PaginatedMeta }> {
  const qs = buildQuery(params ?? {});
  const res = await getResponse<Role[]>(qs ? `roles?${qs}` : "roles");
  return { items: (res.data ?? []) as Role[], meta: res.meta ?? DEFAULT_META };
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
  params: ListUsersParams
): Promise<{ items: IdentityUser[]; meta: PaginatedMeta }> {
  const qs = buildQuery(params);
  const res = await getResponse<IdentityUser[]>(qs ? `users?${qs}` : "users");
  return { items: (res.data ?? []) as IdentityUser[], meta: res.meta ?? DEFAULT_META };
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
