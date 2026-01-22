import * as repo from "../../infrastructure/jadwal-kerja.repository";
import type { JadwalKerja } from "../../domain/entities";

export async function getJadwalKerjaUsecase(id: number): Promise<JadwalKerja> {
  return repo.getJadwalKerja(id);
}
