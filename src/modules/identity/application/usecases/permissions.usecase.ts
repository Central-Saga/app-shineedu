import * as repo from "../../infrastructure/identity.repository";
import type { Permission } from "../../domain/entities";

export async function getPermissionsUsecase(): Promise<Permission[]> {
  return repo.listPermissions();
}
