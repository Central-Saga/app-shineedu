import * as repo from "../../infrastructure/realisasi-jadwal-kerja.repository";
import type { UpdateRealisasiJadwalPayload, RealisasiJadwal } from "../../domain/entities";

export async function updateRealisasiJadwalUsecase(
  id: number,
  payload: UpdateRealisasiJadwalPayload
): Promise<RealisasiJadwal> {
  return repo.updateRealisasiJadwal(id, payload);
}
