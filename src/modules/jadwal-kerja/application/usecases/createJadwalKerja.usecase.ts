import * as repo from "../../infrastructure/jadwal-kerja.repository";
import type { CreateJadwalKerjaPayload, JadwalKerja } from "../../domain/entities";

export async function createJadwalKerjaUsecase(
  payload: CreateJadwalKerjaPayload
): Promise<JadwalKerja> {
  return repo.createJadwalKerja(payload);
}
