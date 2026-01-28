import { get, post, getResponse } from "@/shared/infrastructure/api/httpClient";
import type { ApiResponse } from "@/shared/domain/types";

export interface PaketMurid {
  id: number;
  enrollment_id: number;
  paket_id: number;
  paket_nama?: string;
  saldo_current: number;
  status: 'AKTIF' | 'SELESAI' | 'PAUSED';
  created_at: string;
  updated_at: string;
  paket?: {
    id: number;
    nama: string;
  };
}

export interface LedgerItem {
  id: number;
  paket_murid_id: number;
  tanggal: string;
  type: 'TOPUP' | 'USE' | 'ADJUST' | 'EXPIRE';
  qty: number;
  reason: string;
  created_by?: string;
  created_at: string;
}

export interface CreatePaketPayload {
  paket_id: number;
  tanggal_mulai?: string;
  catatan?: string;
}

export interface AdjustPayload {
  type: 'ADJUST' | 'EXPIRE';
  qty: number;
  reason: string;
}

export const saldoPertemuanApi = {
  getSaldoEnrollment: async (enrollmentId: number): Promise<PaketMurid[]> => {
    try {
      const data = await get<PaketMurid[]>(`enrollments/${enrollmentId}/paket-murid`);
      return data || [];
    } catch (error) {
      console.error("Error fetching saldo:", error);
      return []; // Return empty array on error to prevent UI crash
    }
  },

  createPaketMurid: async (enrollmentId: number, payload: CreatePaketPayload): Promise<void> => {
    await post(`enrollments/${enrollmentId}/paket-murid`, payload);
  },

  getLedger: async (paketMuridId: number, page = 1, perPage = 15): Promise<{ data: LedgerItem[]; meta: any }> => {
    try {
      const res = await getResponse<LedgerItem[]>(`paket-murid/${paketMuridId}/ledger?page=${page}&per_page=${perPage}`);
      return { data: res.data || [], meta: res.meta };
    } catch (error) {
      console.error("Error fetching ledger:", error);
      return { data: [], meta: null };
    }
  },

  adjustSaldo: async (paketMuridId: number, payload: AdjustPayload): Promise<void> => {
    await post(`paket-murid/${paketMuridId}/adjust`, payload);
  }
};
