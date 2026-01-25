import { ApiResponse } from "@/shared/domain/types";
import { CreateKelasValues } from "../domain/schemas";
import { Kelas } from "../domain/types";
import { get, post, put, del } from "@/shared/infrastructure/api/httpClient";

export const academicApi = {
  getKelasList: async (params?: any) => {
    const queryString = new URLSearchParams(params).toString();
    return get<ApiResponse<Kelas[]>>(`kelas?${queryString}`);
  },

  getKelasDetail: async (id: number | string) => {
    return get<ApiResponse<Kelas>>(`kelas/${id}`);
  },

  createKelas: async (data: CreateKelasValues) => {
    return post<ApiResponse<Kelas>>(`kelas`, data);
  },

  updateKelas: async (id: number | string, data: CreateKelasValues) => {
    return put<ApiResponse<Kelas>>(`kelas/${id}`, data);
  },

  deleteKelas: async (id: number | string) => {
    return del<ApiResponse<null>>(`kelas/${id}`);
  },

  getKelasMembers: async (id: number | string) => {
    return get<ApiResponse<Kelas>>(`kelas/${id}/anggota`);
  },

  addKelasMembers: async (id: number | string, data: { enrollment_ids: number[], tanggal_masuk?: string }) => {
    return post<ApiResponse<Kelas>>(`kelas/${id}/anggota`, data);
  },

  removeKelasMember: async (id: number | string, enrollmentId: number | string) => {
    return del<ApiResponse<null>>(`kelas/${id}/anggota/${enrollmentId}`);
  },

  getPrograms: async () => {
      // Assuming the backend returns items array in data, or generic ApiResponse
      return get<ApiResponse<{id: number, nama: string}[]>>('catalog/program');
  },

  getJenjangs: async () => {
      return get<ApiResponse<{id: number, nama: string}[]>>('catalog/jenjang');
  }
};
