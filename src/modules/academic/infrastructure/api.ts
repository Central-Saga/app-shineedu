import { ApiResponse } from "@/shared/domain/types";
import { CreateKelasValues } from "../domain/schemas";
import { Kelas } from "../domain/types";
import { getResponse, del, post, put } from "@/shared/infrastructure/api/httpClient";
import { buildQuery } from "@/shared/lib/buildQuery";

export const academicApi = {
  getKelasList: async (params: Record<string, any> = {}, token?: string) => {
    const queryString = buildQuery(params);
    const options = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
    return getResponse<Kelas[]>(`kelas?${queryString}`, options);
  },

  getKelasDetail: async (id: number | string) => {
    return getResponse<Kelas>(`kelas/${id}`);
  },

  createKelas: async (data: CreateKelasValues) => {
    return post<Kelas>(`kelas`, data);
  },

  updateKelas: async (id: number | string, data: CreateKelasValues) => {
    return put<Kelas>(`kelas/${id}`, data);
  },

  deleteKelas: async (id: number | string) => {
    return del<ApiResponse<null>>(`kelas/${id}`);
  },

  getKelasMembers: async (id: number | string) => {
    return getResponse<Kelas>(`kelas/${id}/anggota`);
  },

  addKelasMembers: async (id: number | string, data: { enrollment_ids: number[], tanggal_masuk?: string }) => {
    return post<Kelas>(`kelas/${id}/anggota`, data);
  },

  removeKelasMember: async (id: number | string, enrollmentId: number | string) => {
    return del<ApiResponse<null>>(`kelas/${id}/anggota/${enrollmentId}`);
  },

  getPrograms: async () => {
      return getResponse<{id: number, nama: string}[]>(`catalog/program`);
  },

  getJenjangs: async () => {
      return getResponse<{id: number, nama: string}[]>(`catalog/jenjang`);
  }
};
