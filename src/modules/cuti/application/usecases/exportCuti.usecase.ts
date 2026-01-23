import * as repo from "../../infrastructure/cuti.repository";
import type { ListCutiParams } from "../../infrastructure/cuti.repository";

export async function exportCutiUsecase(
  format: string,
  params: ListCutiParams
): Promise<void> {
  return repo.exportCuti(format, params);
}
