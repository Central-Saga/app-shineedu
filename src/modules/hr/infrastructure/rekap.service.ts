import { get, getPaginated } from "@/shared/infrastructure/api/httpClient";

export interface RekapBulananParams {
  page?: number;
  per_page?: number;
  q?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
  bulan: number;
  tahun: number;
  kategori_karyawan?: string;
  subtipe_kontrak?: string;
  tipe_gaji?: string;
  status?: string;
}

export interface RekapSummary {
  absensi: {
    hadir: number;
    izin: number;
    sakit: number;
    total_durasi_menit: number;
  };
  cuti: {
    cuti_disetujui: number;
    izin_disetujui: number;
    sakit_disetujui: number;
  };
  jadwal: {
    sesi_terlaksana: number;
    sesi_digantikan: number;
    sesi_menggantikan: number;
    total_realisasi_entry: number;
  };
}

export interface RekapBulananItem {
  employee: {
    id: number;
    nama: string;
    kode_karyawan: string;
    kategori_karyawan: string;
    subtipe_kontrak: string;
    tipe_gaji: string;
    status: string;
  };
  absensi: RekapSummary['absensi'];
  cuti: RekapSummary['cuti'];
  jadwal: RekapSummary['jadwal'];
}

export interface PayrollPreview {
  employee: {
    id: number;
    nama: string;
    kode_karyawan: string;
    tipe_gaji: string;
  };
  periode: {
    month: number;
    year: number;
  };
  komponen: {
    gaji_pokok: number;
    fee_sesi: number;
    potongan: Array<{
      jenis: string;
      jumlah_hari: number;
      rule: string;
      nilai_satuan: number;
      total: number;
    }>;
    total_potongan: number;
  };
  totals: {
    total_pendapatan: number;
    gaji_bersih: number;
  };
}

export const rekapService = {
  getRekapList: async (params: RekapBulananParams) => {
    // getPaginated automatically handles params object -> query string
    return await getPaginated<RekapBulananItem[]>("/rekap-bulanan", params);
  },

  getRekapDetail: async (id: number, params: { bulan: number; tahun: number }) => {
    const qs = new URLSearchParams({ 
        bulan: params.bulan.toString(), 
        tahun: params.tahun.toString() 
    }).toString();
    return await get<any>(`/rekap-bulanan/${id}?${qs}`);
  },

  getGajiPreview: async (karyawanId: number, params: { bulan: number; tahun: number }) => {
    const qs = new URLSearchParams({
        karyawan_id: karyawanId.toString(),
        bulan: params.bulan.toString(),
        tahun: params.tahun.toString()
    }).toString();
    return await get<PayrollPreview>(`/gaji/preview?${qs}`);
  },
};
