import * as repo from "../../infrastructure/jadwal-kerja.repository";
import type { UpdateJadwalKerjaPayload, JadwalKerja } from "../../domain/entities";

export async function updateJadwalKerjaUsecase(
  id: number,
  payload: UpdateJadwalKerjaPayload
): Promise<JadwalKerja> {
  return repo.updateJadwalKerja(id, payload);
}
