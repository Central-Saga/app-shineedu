
import { getAbsensiDetail } from "../../infrastructure/absensi.repository";
import type { Absensi } from "../../domain/entities";

export async function getAbsensiDetailUsecase(id: number): Promise<Absensi> {
  return await getAbsensiDetail(id);
}
