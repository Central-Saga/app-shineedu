import * as repo from "../../infrastructure/realisasi-jadwal-kerja.repository";
import type { ListRealisasiJadwalParams } from "../../infrastructure/realisasi-jadwal-kerja.repository";

export async function exportRealisasiJadwalKerjaUsecase(
  format: string,
  params: ListRealisasiJadwalParams
): Promise<void> {
  return repo.exportRealisasiJadwalKerja(format, params);
}
