import * as repo from "../../infrastructure/realisasi-jadwal-kerja.repository";
import type { ListRealisasiJadwalParams } from "../../infrastructure/realisasi-jadwal-kerja.repository";
import type { PaginatedMeta } from "@/shared/domain/types";
import type { RealisasiJadwal } from "../../domain/entities";

export async function getRealisasiJadwalListUsecase(
  params: ListRealisasiJadwalParams = {}
): Promise<{ items: RealisasiJadwal[]; meta: PaginatedMeta }> {
  return repo.listRealisasiJadwal(params);
}
