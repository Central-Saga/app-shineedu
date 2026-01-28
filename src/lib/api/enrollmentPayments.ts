import { get, post } from "@/shared/infrastructure/api/httpClient";
import type { KasTransaksi } from "./kas";
import type { PaketMurid } from "./saldo-pertemuan";

// Types
export interface PayRegistrationFeePayload {
  amount: number;
  metode: string;
  tanggal?: string;
  keterangan?: string;
  external_ref?: string;
  idempotency_key?: string;
}

export interface PayPackageTopupPayload {
  paket_murid_id?: number;  // If assigning to existing paket_murid
  paket_id?: number;        // If creating new paket_murid
  topup_qty?: number;       // Override default qty from paket master
  amount: number;
  metode: string;
  tanggal?: string;
  keterangan?: string;
  external_ref?: string;
  idempotency_key?: string;
}

export interface SaldoPertemuanData {
  paket_murid: PaketMurid[];
  transaksi_terakhir?: KasTransaksi[];
}

export interface EnrollmentTransaksi {
  id: number;
  type: 'IN' | 'OUT';
  tanggal: string;
  amount: number;
  metode: string;
  kategori: string;
  keterangan?: string;
  external_ref?: string;
  created_at: string;
}

// API Functions
export const enrollmentPaymentsApi = {
  /**
   * Pay registration fee for an enrollment
   */
  payRegistrationFee: async (enrollmentId: number, payload: PayRegistrationFeePayload): Promise<{ transaksi_id: number; message: string }> => {
    const res = await post<{ transaksi_id: number; message: string }>(`enrollments/${enrollmentId}/pay-registration-fee`, payload);
    return res;
  },

  /**
   * Pay for package / topup meeting quota
   * Supports both JSON payload and FormData (for file uploads)
   */
  payPackageTopup: async (
    enrollmentId: number, 
    payload: PayPackageTopupPayload | FormData
  ): Promise<{ 
    transaksi_id?: number; 
    transaction?: { id: number }; 
    paket_murid_id: number; 
    saldo_baru: number; 
    message: string 
  }> => {
    const res = await post<{ 
      transaksi_id?: number; 
      transaction?: { id: number }; 
      paket_murid_id: number; 
      saldo_baru: number; 
      message: string 
    }>(`enrollments/${enrollmentId}/pay-package-topup`, payload);
    return res;
  },

  /**
   * Get saldo pertemuan for an enrollment (combined endpoint)
   * Falls back to separate calls if combined endpoint not available
   */
  getSaldoPertemuan: async (enrollmentId: number): Promise<SaldoPertemuanData> => {
    try {
      // Try combined endpoint first
      const res = await get<{ saldo: PaketMurid[]; transaksi_terakhir: KasTransaksi[] }>(`enrollments/${enrollmentId}/saldo-dan-transaksi`);
      return {
        paket_murid: res.saldo || [],
        transaksi_terakhir: res.transaksi_terakhir || []
      };
    } catch (error: unknown) {
      // Fallback to separate calls if combined endpoint not available
      const err = error as { status?: number };
      if (err?.status === 404) {
        const paketMuridRes = await get<PaketMurid[]>(`enrollments/${enrollmentId}/paket-murid`);
        return {
          paket_murid: paketMuridRes || [],
          transaksi_terakhir: []
        };
      }
      throw error;
    }
  },

  /**
   * Get transaction history for an enrollment
   */
  getTransaksiEnrollment: async (enrollmentId: number, page = 1, perPage = 5): Promise<{ data: EnrollmentTransaksi[]; meta: unknown }> => {
    try {
      // Use the same endpoint as getSaldoPertemuan but extract only transaksi
      const res = await get<{ saldo: PaketMurid[]; transaksi_terakhir: EnrollmentTransaksi[] }>(`enrollments/${enrollmentId}/saldo-dan-transaksi?page=${page}&per_page=${perPage}`);
      return {
        data: res.transaksi_terakhir || [],
        meta: null
      };
    } catch (error) {
      console.error("Error fetching enrollment transactions:", error);
      return { data: [], meta: null };
    }
  }
};
