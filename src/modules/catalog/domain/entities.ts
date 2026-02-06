export interface Jenjang {
  id: number;
  kode: string;
  nama: string;
  status: "Aktif" | "Non Aktif";
  created_at: string;
  updated_at: string;
}

export interface Program {
  id: number;
  kode: string;
  nama: string;
  deskripsi?: string;
  status: "Aktif" | "Non Aktif";
  is_highlight?: boolean;
  jenjangs?: Jenjang[];
  created_at: string;
  updated_at: string;
}

export interface Paket {
  id: number;
  kode: string;
  nama: string;
  tipe: string;
  pertemuan_per_bulan?: number;
  durasi_menit: number;
  boleh_mix_mapel: boolean;
  max_mapel?: number;
  bisa_tambah_pertemuan: boolean;
  bisa_ganti_hari: boolean;
  status: "Aktif" | "Non Aktif";
  created_at: string;
  updated_at: string;
}

export interface PaketHarga {
  id: number;
  program_id: number;
  jenjang_id: number;
  paket_id: number;
  min_siswa: number;
  max_siswa: number;
  harga: number;
  effective_from?: string;
  effective_to?: string;
  status: "Aktif" | "Non Aktif";
  program?: Program;
  jenjang?: Jenjang;
  paket?: Paket;
  created_at: string;
  updated_at: string;
}

export interface PricingLookupResult {
  harga: number;
  rule: PaketHarga;
}

// Payload Types
export interface CreateJenjangPayload {
  kode: string;
  nama: string;
  status: "Aktif" | "Non Aktif";
}

export interface UpdateJenjangPayload extends Partial<CreateJenjangPayload> {}

export interface CreateProgramPayload {
  kode: string;
  nama: string;
  deskripsi?: string;
  status: "Aktif" | "Non Aktif";
  is_highlight?: boolean;
  jenjang_ids?: number[];
}

export interface UpdateProgramPayload extends Partial<CreateProgramPayload> {}

export interface CreatePaketPayload {
  kode: string;
  nama: string;
  tipe: string;
  pertemuan_per_bulan?: number;
  durasi_menit: number;
  boleh_mix_mapel: boolean;
  max_mapel?: number;
  bisa_tambah_pertemuan: boolean;
  bisa_ganti_hari: boolean;
  status: "Aktif" | "Non Aktif";
}

export interface UpdatePaketPayload extends Partial<CreatePaketPayload> {}

export interface CreatePaketHargaPayload {
  program_id: number;
  jenjang_id: number;
  paket_id: number;
  min_siswa: number;
  max_siswa: number;
  harga: number;
  effective_from?: string;
  effective_to?: string;
  status: "Aktif" | "Non Aktif";
}

export interface UpdatePaketHargaPayload extends Partial<CreatePaketHargaPayload> {}

export interface LookupPriceParams {
  program_id: string;
  jenjang_id: string;
  paket_id: string;
  jumlah_siswa: string;
  tanggal?: string;
}
