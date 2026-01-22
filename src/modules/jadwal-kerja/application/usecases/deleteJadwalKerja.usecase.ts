import * as repo from "../../infrastructure/jadwal-kerja.repository";

export async function deleteJadwalKerjaUsecase(id: number): Promise<void> {
  return repo.deleteJadwalKerja(id);
}
