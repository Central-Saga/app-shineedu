import * as repo from "../../infrastructure/identity.repository";
import type { ListRolesParams } from "../../infrastructure/identity.repository";
import type { Role } from "../../domain/entities";
import type { PaginatedMeta } from "@/shared/domain/types";

export async function getRolesUsecase(
  params?: ListRolesParams
): Promise<{ items: Role[]; meta: PaginatedMeta }> {
  const { items, meta } = await repo.listRoles(params ?? {});
  return { items, meta };
}

export async function getRoleUsecase(id: number): Promise<Role> {
  return repo.getRole(id);
}

export async function createRoleUsecase(payload: {
  name: string;
  permissions?: string[];
}): Promise<Role> {
  return repo.createRole(payload);
}

export async function updateRoleUsecase(
  id: number,
  payload: { name: string }
): Promise<Role> {
  return repo.updateRole(id, payload);
}

export async function deleteRoleUsecase(id: number): Promise<void> {
  return repo.deleteRole(id);
}

export async function syncRolePermissionsUsecase(
  id: number,
  permissions: string[]
): Promise<Role> {
  return repo.syncRolePermissions(id, permissions);
}

export async function exportRolesUsecase(
  format: string,
  params?: ListRolesParams
): Promise<void> {
  return repo.exportRoles(format, params);
}

