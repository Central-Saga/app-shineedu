import * as repo from "../../infrastructure/jadwal-kerja.repository";
import type { ListJadwalKerjaParams } from "../../infrastructure/jadwal-kerja.repository";
import type { PaginatedMeta } from "@/shared/domain/types";
import type { JadwalKerja } from "../../domain/entities";

export async function getJadwalKerjaListUsecase(
  params: ListJadwalKerjaParams = {}
): Promise<{ items: JadwalKerja[]; meta: PaginatedMeta }> {
  return repo.listJadwalKerja(params);
}
