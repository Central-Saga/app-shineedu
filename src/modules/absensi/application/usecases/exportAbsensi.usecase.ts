import * as repo from "../../infrastructure/absensi.repository";
import type { ListAbsensiParams } from "../../infrastructure/absensi.repository";

export async function exportAbsensiUsecase(
  format: string,
  params: ListAbsensiParams
): Promise<void> {
  return repo.exportAbsensi(format, params);
}
