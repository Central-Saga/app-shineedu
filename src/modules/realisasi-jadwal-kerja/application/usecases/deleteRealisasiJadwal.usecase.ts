import * as repo from "../../infrastructure/realisasi-jadwal-kerja.repository";

export async function deleteRealisasiJadwalUsecase(id: number): Promise<void> {
  return repo.deleteRealisasiJadwal(id);
}
