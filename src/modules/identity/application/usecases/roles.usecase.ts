import * as repo from "../../infrastructure/identity.repository";
import type { Role } from "../../domain/entities";

export async function getRolesUsecase(): Promise<Role[]> {
  return repo.listRoles();
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
