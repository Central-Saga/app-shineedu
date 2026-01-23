import * as repo from "../../infrastructure/jadwal-kerja.repository";
import type { ListJadwalKerjaParams } from "../../infrastructure/jadwal-kerja.repository";

export async function exportJadwalKerjaUsecase(
  format: string,
  params: ListJadwalKerjaParams
): Promise<void> {
  return repo.exportJadwalKerja(format, params);
}
