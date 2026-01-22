import * as repo from "../../infrastructure/realisasi-jadwal-kerja.repository";
import type { RealisasiJadwal } from "../../domain/entities";

export async function getRealisasiJadwalUsecase(id: number): Promise<RealisasiJadwal> {
  return repo.getRealisasiJadwal(id);
}
