import * as repo from "../../infrastructure/identity.repository";
import type { ListUsersParams } from "../../infrastructure/identity.repository";
import type { IdentityUser } from "../../domain/entities";
import type { PaginatedMeta } from "@/shared/domain/types";

export async function getUsersUsecase(
  params: ListUsersParams
): Promise<{ users: IdentityUser[]; meta: PaginatedMeta }> {
  const { items, meta } = await repo.listUsers(params);
  return { users: items, meta };
}

export async function getUserUsecase(id: number): Promise<IdentityUser> {
  return repo.getUser(id);
}

export async function createUserUsecase(payload: {
  name: string;
  email: string;
  password: string;
  status: string;
  role: string;
}): Promise<IdentityUser> {
  return repo.createUser(payload);
}

export async function updateUserUsecase(
  id: number,
  payload: { name?: string; email?: string; status?: string; password?: string }
): Promise<IdentityUser> {
  return repo.updateUser(id, payload);
}

export async function deleteUserUsecase(id: number): Promise<void> {
  return repo.deleteUser(id);
}

export async function updateUserRoleUsecase(
  id: number,
  roleName: string
): Promise<IdentityUser> {
  return repo.updateUserRole(id, roleName);
}
