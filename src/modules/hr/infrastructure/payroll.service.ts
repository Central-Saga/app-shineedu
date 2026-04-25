import { get, getPaginated, post, put, download } from "@/shared/infrastructure/api/httpClient";

export interface PayrollParams {
  page?: number;
  per_page?: number;
  q?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
  bulan: number;
  tahun: number;
  status?: string;
  karyawan_id?: string;
}

export interface Payroll {
  id: number;
  karyawan_id: number;
  bulan: number;
  tahun: number;
  gaji_pokok: number;
  total_fee_mengajar: number;
  total_potongan: number;
  gaji_bersih: number;
  status: "draft" | "generated" | "approved" | "paid" | "transferred";
  tanggal_pembayaran: string | null;
  detail_potongan: any[];
  detail_pendapatan: any[];
  employee: {
    id: number;
    nama: string;
    kode_karyawan: string;
    kategori_karyawan: string;
    user?: { name: string; email: string };
  };
}

export const payrollService = {
  getPayrolls: async (params: PayrollParams) => {
    return await getPaginated<Payroll[]>("/payrolls", params);
  },

  generatePayroll: async (bulan: number, tahun: number) => {
    return await post<Payroll[]>("/payrolls/generate", { bulan, tahun });
  },

  getPayrollDetail: async (id: number) => {
    return await get<Payroll>(`/payrolls/${id}`);
  },

  updateStatus: async (id: number, status: string) => {
    return await put<Payroll>(`/payrolls/${id}/status`, { status });
  },

  downloadSlip: async (id: number, filename?: string) => {
    return await download(`/payrolls/${id}/export`, {}, filename);
  },
};
