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
    pertemuan_per_bulan?: number;
  };
}

export interface LedgerItem {
  id: number;
  paket_murid_id: number;
  tanggal: string;
  type: 'TOPUP' | 'USE' | 'ADJUST' | 'EXPIRE';
  qty: number;
  reason: string;
  created_by?: {
    id: number;
    name: string;
  };
  paket_murid?: {
    id: number;
    paket_id: number;
    paket: {
      id: number;
      nama: string;
    }
  };
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

  createPaketMurid: async (enrollmentId: number, payload: CreatePaketPayload): Promise<PaketMurid> => {
    const result = await post<PaketMurid>(`enrollments/${enrollmentId}/paket-murid`, payload);
    return result;
  },

  getLedger: async (paketMuridId: number, page: number = 1, enrollmentId?: number, paketId?: number): Promise<{ data: LedgerItem[]; meta: any }> => {
    try {
      let url = `paket-murid/${paketMuridId}/ledger?page=${page}`;
      if (enrollmentId && paketId) {
          url = `paket-murid/ledger/all?page=${page}&enrollment_id=${enrollmentId}&paket_id=${paketId}`;
      }
      const res = await getResponse<LedgerItem[]>(url);
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

// Export individual functions for convenience
export const { getSaldoEnrollment, createPaketMurid, getLedger, adjustSaldo } = saldoPertemuanApi;
