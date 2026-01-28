import { get, post, getResponse } from "@/shared/infrastructure/api/httpClient";
import type { PaginatedMeta } from "@/shared/domain/types";

// Types
export interface KasTransaksi {
  id: number;
  type: 'IN' | 'OUT';
  tanggal: string;
  amount: number;
  metode: string;
  kategori: string;
  pihak?: string;
  keterangan?: string;
  external_ref?: string;
  enrollment_id?: number;
  paket_murid_id?: number;
  enrollment?: {
    id: number;
    kode_enrollment: string;
    murid?: {
      id: number;
      nama_lengkap: string;
    };
  };
  created_by?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface KasTransaksiListParams {
  q?: string;
  type?: 'IN' | 'OUT';
  kategori?: string;
  tanggal_from?: string;
  tanggal_to?: string;
  page?: number;
  per_page?: number;
}

export interface CreateKasTransaksiPayload {
  type: 'IN' | 'OUT';
  tanggal?: string;
  amount: number;
  metode: string;
  kategori: string;
  pihak?: string;
  keterangan?: string;
  external_ref?: string;
  idempotency_key?: string;
}

export interface KasTransaksiListResult {
  data: KasTransaksi[];
  meta: PaginatedMeta;
}

// API Functions
export const kasApi = {
  /**
   * List kas transactions with filters and pagination
   */
  list: async (params: KasTransaksiListParams = {}): Promise<KasTransaksiListResult> => {
    try {
      const queryParams = new URLSearchParams();
      if (params.q) queryParams.set('q', params.q);
      if (params.type) queryParams.set('type', params.type);
      if (params.kategori) queryParams.set('kategori', params.kategori);
      if (params.tanggal_from) queryParams.set('tanggal_from', params.tanggal_from);
      if (params.tanggal_to) queryParams.set('tanggal_to', params.tanggal_to);
      if (params.page) queryParams.set('page', String(params.page));
      if (params.per_page) queryParams.set('per_page', String(params.per_page));
      
      const queryString = queryParams.toString();
      const url = `kas/transaksi${queryString ? `?${queryString}` : ''}`;
      
      const res = await getResponse<KasTransaksi[]>(url);
      return {
        data: res.data || [],
        meta: res.meta || { current_page: 1, last_page: 1, per_page: 15, total: 0 } as PaginatedMeta
      };
    } catch (error) {
      console.error("Error fetching kas transactions:", error);
      throw error;
    }
  },

  /**
   * Create a new kas transaction
   */
  create: async (payload: CreateKasTransaksiPayload): Promise<KasTransaksi> => {
    const res = await post<KasTransaksi>('kas/transaksi', payload);
    return res;
  },

  /**
   * Get a single kas transaction by ID
   */
  get: async (id: number): Promise<KasTransaksi> => {
    const res = await get<KasTransaksi>(`kas/transaksi/${id}`);
    return res;
  }
};

// Kategori options for the form
export const KAS_KATEGORI_OPTIONS = [
  { value: 'PENDAFTARAN', label: 'Biaya Pendaftaran' },
  { value: 'PAKET', label: 'Pembayaran Paket' },
  { value: 'GAJI', label: 'Gaji Karyawan' },
  { value: 'OPERASIONAL', label: 'Operasional' },
  { value: 'LAINNYA', label: 'Lainnya' },
] as const;

export const KAS_METODE_OPTIONS = [
  { value: 'TUNAI', label: 'Tunai' },
  { value: 'TRANSFER', label: 'Transfer Bank' },
  { value: 'QRIS', label: 'QRIS' },
  { value: 'EDC', label: 'EDC / Kartu' },
  { value: 'LAINNYA', label: 'Lainnya' },
] as const;
