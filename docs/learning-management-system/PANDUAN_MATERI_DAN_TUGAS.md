# 📚 Panduan Penggunaan Materi Modul & Tugas

## 🎯 Konsep Sistem

Sistem materi dan tugas di Shine Education Bali menggunakan pendekatan **berbasis SESI (pertemuan)**, bukan berbasis kelas/program. Ini memungkinkan personalisasi pembelajaran untuk setiap murid.

### Struktur Hierarki:

```
Kelas
  └─ Sesi (Pertemuan 1, 2, 3, ...)
       ├─ Materi Modul (bisa berbeda per murid)
       └─ Tugas (bisa berbeda per murid)
```

### Aturan Access Control:

- ✅ Murid **bisa akses** materi/tugas dari sesi yang **sudah dimulai** (berdasarkan tanggal sesi)
- ❌ Murid **tidak bisa akses** materi/tugas dari sesi yang **belum dimulai**
- ✅ Meskipun tugas sesi sebelumnya belum selesai, murid tetap bisa akses sesi berikutnya **jika sesi tersebut sudah dimulai**

---

## 🔄 Flow Penggunaan untuk Admin/Guru

### 1️⃣ **Buat Materi Modul** (Opsional - untuk template)

**Halaman**: `/dashboard/materi-modul`

**Langkah**:

1. Klik tombol **"Buat Modul"**
2. Isi form:
    - **Judul**: Nama materi (contoh: "Pengenalan Aljabar")
    - **Deskripsi**: Penjelasan singkat
    - **Program**: Pilih program (opsional)
    - **Jenjang**: Pilih jenjang (opsional)
    - **Status**: Aktif/Nonaktif
3. Klik **"Buat Modul"**
4. Setelah dibuat, Anda akan diarahkan ke halaman edit untuk menambahkan **items** (konten materi)

**Catatan**:

- Materi modul ini adalah **template/library** yang bisa digunakan berulang kali
- Satu materi modul bisa memiliki banyak items (video, dokumen, quiz, dll)

---

### 2️⃣ **Buat Kelas dan Tambahkan Murid**

**Halaman**: `/dashboard/kelas`

**Langkah**:

1. Buat kelas baru atau pilih kelas yang sudah ada
2. Masuk ke **Detail Kelas** → Tab **"Daftar Anggota"**
3. Klik **"Tambah Anggota"** untuk menambahkan murid ke kelas

---

### 3️⃣ **Buat Sesi Pertemuan**

**Halaman**: `/dashboard/kelas/[id]` → Tab **"Sesi Pertemuan"**

**Langkah**:

1. Masuk ke Detail Kelas
2. Klik tab **"Sesi Pertemuan"**
3. Buat sesi baru dengan mengisi:
    - **Tanggal & Waktu**: Kapan sesi berlangsung
    - **Nomor Sesi**: Urutan pertemuan (1, 2, 3, ...)
    - **Guru**: Siapa yang mengajar
    - **Status**: Draft/Terjadwal/Selesai
4. Simpan sesi

**Penting**:

- Tanggal sesi menentukan kapan murid bisa akses materi/tugas
- Sesi harus dibuat terlebih dahulu sebelum assign tugas

---

### 4️⃣ **Assign Tugas ke Murid (Per Sesi)**

**Halaman**: `/dashboard/assignments`

**Langkah**:

1. Klik **"Buat Tugas"**
2. Isi form:
    - **Enrollment (Murid)**: Pilih murid yang akan diberi tugas
    - **Judul Tugas**: Nama tugas (contoh: "PR Matematika Bab 1")
    - **Instruksi**: Penjelasan cara mengerjakan
    - **Materi Terkait**: Pilih materi modul (opsional)
    - **Tenggat Waktu**: Deadline pengumpulan (opsional)
3. Klik **"Buat Tugas"**

**Catatan**:

- Satu tugas = satu murid (personalized)
- Jika ingin memberi tugas yang sama ke banyak murid, buat tugas berulang kali
- Tugas akan otomatis terkait dengan sesi yang sedang berlangsung

---

## 📊 Contoh Skenario Penggunaan

### Skenario: Kelas Matematika dengan 3 Murid

```
Kelas: Matematika Dasar
Murid: Andi, Budi, Citra

Sesi 1 (20 Jan 2026) - Sudah lewat
├─ Materi: Pengenalan Aljabar
├─ Tugas Andi: PR Bab 1 (Level Dasar) - Status: Belum selesai
├─ Tugas Budi: PR Bab 1 (Level Menengah) - Status: Selesai
└─ Tugas Citra: PR Bab 1 (Level Lanjut) - Status: Belum selesai

Sesi 2 (27 Jan 2026) - Sudah lewat
├─ Materi: Persamaan Linear
├─ Tugas Andi: PR Bab 2 (Level Dasar) - Status: Selesai
├─ Tugas Budi: PR Bab 2 (Level Menengah) - Status: Selesai
└─ Tugas Citra: PR Bab 2 (Level Lanjut) - Status: Selesai

Sesi 3 (30 Jan 2026) - Hari ini ✓ Bisa diakses
├─ Materi: Fungsi Kuadrat
├─ Tugas Andi: PR Bab 3 (Level Dasar) - Baru dibuat
├─ Tugas Budi: PR Bab 3 (Level Menengah) - Baru dibuat
└─ Tugas Citra: PR Bab 3 (Level Lanjut) - Baru dibuat

Sesi 4 (3 Feb 2026) - Belum dimulai ✗ Tidak bisa diakses
└─ Belum ada tugas (sesi belum dimulai)
```

**Yang Terjadi**:

- Andi, Budi, Citra bisa mengerjakan tugas Sesi 1 yang belum selesai
- Mereka juga bisa akses materi dan tugas Sesi 2 & 3
- Mereka **tidak bisa** akses Sesi 4 karena belum waktunya (3 Feb)
- Meskipun Andi belum selesai tugas Sesi 1, dia tetap bisa akses Sesi 3

---

## 🎨 Halaman-Halaman yang Perlu Diakses

### Untuk Admin/Guru:

1. **Dashboard Materi Modul**: `/dashboard/materi-modul`
    - Lihat semua template materi
    - Buat materi baru
    - Edit materi yang sudah ada

2. **Dashboard Tugas**: `/dashboard/assignments`
    - Lihat semua tugas yang sudah dibuat
    - Filter berdasarkan status (Ditugaskan, Dikirim, Direview)
    - Buat tugas baru

3. **Detail Kelas**: `/dashboard/kelas/[id]`
    - Tab "Daftar Anggota": Kelola murid di kelas
    - Tab "Sesi Pertemuan": Lihat dan kelola sesi
    - Tab "Logbook Summary": Lihat ringkasan kehadiran dan progress

4. **Buat Tugas**: `/dashboard/assignments/create`
    - Form untuk assign tugas ke murid

### Untuk Murid (Student View):

> **Catatan**: Halaman student view akan dibuat selanjutnya dengan fitur:
>
> - Lihat materi & tugas per sesi
> - Hanya tampil sesi yang sudah dimulai
> - Upload jawaban tugas
> - Lihat feedback dari guru

---

## 📝 Catatan Penting

### ✅ Yang Sudah Selesai:

- ✅ Desain konsisten untuk halaman Materi Modul dan Tugas
- ✅ Breadcrumb navigation
- ✅ Stats cards dengan statistik
- ✅ Filter, search, dan sorting
- ✅ Form untuk create/edit materi dan tugas
- ✅ Integrasi dengan sistem Sesi

### 🔄 Yang Perlu Dikembangkan Selanjutnya:

- 🔄 Student view untuk murid melihat materi & tugas mereka
- 🔄 Access control berbasis waktu sesi (backend)
- 🔄 Bulk assignment (assign tugas ke banyak murid sekaligus)
- 🔄 Progress tracking per murid
- 🔄 Notification ketika tugas baru tersedia

---

## 🆘 Troubleshooting

### Tugas tidak muncul untuk murid?

- Pastikan murid sudah terdaftar di kelas (enrollment)
- Pastikan sesi sudah dibuat dan tanggalnya sudah lewat
- Pastikan tugas sudah di-assign ke enrollment murid tersebut

### Murid bisa akses sesi yang belum waktunya?

- Implementasi access control berbasis waktu masih perlu dikembangkan di backend
- Saat ini sistem mengandalkan tanggal sesi untuk filtering

### Bagaimana cara memberi tugas yang sama ke semua murid?

- Saat ini harus membuat tugas satu per satu untuk setiap murid
- Fitur bulk assignment akan dikembangkan selanjutnya

---

## 📞 Kontak

Jika ada pertanyaan atau butuh bantuan, silakan hubungi tim development.

**Terakhir diupdate**: 30 Januari 2026
