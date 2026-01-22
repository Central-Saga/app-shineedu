import * as repo from "../../infrastructure/realisasi-jadwal-kerja.repository";
import type { CreateRealisasiJadwalPayload, RealisasiJadwal } from "../../domain/entities";

export async function createRealisasiJadwalUsecase(
  payload: CreateRealisasiJadwalPayload
): Promise<RealisasiJadwal> {
  return repo.createRealisasiJadwal(payload);
}
