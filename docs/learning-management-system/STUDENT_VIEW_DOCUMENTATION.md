# 🎓 Student View - Dokumentasi Lengkap

## ✅ Apa yang Sudah Dibuat

### 1. **Halaman Pembelajaran Murid** (`/student/learning`)

**File**:

- `/src/app/(protected)/student/learning/page.tsx`
- `/src/modules/learning/presentation/components/StudentLearningClient.tsx`

**Fitur**:

- ✅ Menampilkan semua kelas yang diikuti murid
- ✅ Card untuk setiap kelas dengan informasi:
    - Nama kelas & kode kelas
    - Program & Jenjang
    - Progress bar (berapa sesi yang sudah selesai)
    - Stats: Jumlah sesi & tugas
    - Alert untuk tugas yang belum dikerjakan
- ✅ Button "Lihat Detail" untuk masuk ke detail kelas

**Screenshot Fitur**:

```
┌─────────────────────────────────────┐
│ Pembelajaran Saya                   │
│ Lihat materi dan tugas dari semua   │
│ kelas yang Anda ikuti               │
├─────────────────────────────────────┤
│  ┌───────────────┐ ┌───────────────┐│
│  │ Matematika    │ │ Bahasa Inggris││
│  │ Dasar         │ │ Level 1       ││
│  │ ─────────────  │ │ ─────────────  ││
│  │ Progress: 60% │ │ Progress: 80% ││
│  │ Sesi: 3/5     │ │ Sesi: 4/5     ││
│  │ Tugas: 2/3    │ │ Tugas: 5/5    ││
│  │ [Lihat Detail]│ │ [Lihat Detail]││
│  └───────────────┘ └───────────────┘│
└─────────────────────────────────────┘
```

---

### 2. **Halaman Detail Kelas** (`/student/learning/[kelasId]`)

**File**:

- `/src/app/(protected)/student/learning/[kelasId]/page.tsx`
- `/src/modules/learning/presentation/components/StudentKelasDetailClient.tsx`

**Fitur**:

- ✅ Menampilkan informasi kelas (nama, program, jenjang)
- ✅ List pertemuan/sesi yang **sudah dimulai** (access control)
- ✅ Setiap sesi menampilkan:
    - Nomor pertemuan
    - Tanggal & jam
    - Status sesi (Terjadwal/Selesai)
    - Daftar tugas untuk sesi tersebut
- ✅ Tugas ditampilkan dengan:
    - Judul tugas
    - Deadline
    - Status (Belum Dikerjakan/Sudah Dikirim/Sudah Direview)
    - Button "Kerjakan" atau "Lihat"
    - Alert jika terlambat

**Access Control**:

- ⚠️ **Murid HANYA bisa melihat sesi yang sudah dimulai**
- ⚠️ **Murid TIDAK bisa melihat sesi yang belum dimulai**
- ✅ Filter otomatis berdasarkan tanggal hari ini

**Screenshot Fitur**:

```
┌─────────────────────────────────────┐
│ ← Matematika Dasar                  │
│   Program A • Jenjang 1             │
├─────────────────────────────────────┤
│ Daftar Pertemuan                    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Pertemuan #3                    │ │
│ │ Senin, 27 Jan 2026 • 10:00-12:00│ │
│ │ Status: SELESAI                 │ │
│ │                                 │ │
│ │ Tugas (2):                      │ │
│ │ • PR Matematika Bab 1           │ │
│ │   Deadline: 30 Jan 2026         │ │
│ │   [Sudah Dikirim] [Lihat]       │ │
│ │ • Latihan Soal                  │ │
│ │   [Belum Dikerjakan] [Kerjakan] │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Pertemuan #2                    │ │
│ │ Senin, 20 Jan 2026 • 10:00-12:00│ │
│ │ ...                             │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

### 3. **Dialog Submit Tugas**

**File**:

- `/src/modules/learning/presentation/components/SubmitAssignmentDialog.tsx`

**Fitur untuk Submit Tugas**:

- ✅ Form untuk mengerjakan tugas:
    - Text area untuk jawaban
    - Upload file (PDF, DOC, DOCX, JPG, PNG, max 10MB)
    - Button "Kirim Tugas"
- ✅ Menampilkan instruksi tugas
- ✅ Menampilkan materi terkait (jika ada)
- ✅ Menampilkan deadline
- ✅ Alert jika terlambat

**Fitur untuk Lihat Submission**:

- ✅ Menampilkan jawaban yang sudah dikirim
- ✅ Menampilkan file yang diupload (dengan button download)
- ✅ Menampilkan tanggal submit
- ✅ Menampilkan feedback dari guru
- ✅ Menampilkan nilai (jika sudah dinilai)
- ✅ Status badge (Diterima/Perlu Revisi/Menunggu Review)
- ✅ Button "Kirim Ulang" jika perlu revisi

**Screenshot Fitur**:

```
┌─────────────────────────────────────┐
│ PR Matematika Bab 1                 │
│ Kerjakan dan kirim tugas Anda       │
├─────────────────────────────────────┤
│ Instruksi:                          │
│ Kerjakan soal halaman 15-20         │
│                                     │
│ Materi Terkait: Pengenalan Aljabar  │
│ Deadline: Kamis, 30 Jan 2026        │
├─────────────────────────────────────┤
│ Jawaban Anda *                      │
│ ┌─────────────────────────────────┐ │
│ │ [Text area untuk jawaban]       │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ File Lampiran (Opsional)            │
│ [Choose File] No file chosen        │
│                                     │
│ [Batal]  [Kirim Tugas]              │
└─────────────────────────────────────┘
```

---

### 4. **Assignment Repository Enhancement**

**File**:

- `/src/modules/learning/infrastructure/assignment.repository.ts`

**Method Baru**:

```typescript
submitAssignment(
  assignmentId: number | string,
  data: {
    content_text?: string;
    attachment?: File
  }
): Promise<AssignmentSubmission>
```

**Fungsi**:

- Menggabungkan `submit` (text only) dan `submitWithFile` (text + file)
- Otomatis memilih endpoint yang tepat berdasarkan ada/tidaknya file

---

## 🎯 Cara Testing Student View

### **Prasyarat**:

1. Buat akun user dengan role **Student** (bukan Super Admin)
2. Buat murid dan link ke user tersebut
3. Buat enrollment untuk murid tersebut
4. Buat kelas dan tambahkan murid ke kelas
5. Buat sesi untuk kelas
6. Assign tugas ke murid

### **Langkah Testing**:

#### **1. Login sebagai Student**

```
1. Logout dari Super Admin
2. Login dengan akun student
3. Navigate ke /student/learning
```

#### **2. Test Halaman Pembelajaran Saya**

```
✓ Pastikan muncul card untuk setiap kelas yang diikuti
✓ Pastikan progress bar menunjukkan persentase yang benar
✓ Pastikan stats (sesi & tugas) akurat
✓ Klik "Lihat Detail" untuk masuk ke detail kelas
```

#### **3. Test Halaman Detail Kelas**

```
✓ Pastikan hanya sesi yang sudah dimulai yang muncul
✓ Pastikan sesi yang belum dimulai TIDAK muncul
✓ Pastikan tugas untuk setiap sesi ditampilkan
✓ Pastikan status tugas akurat (Belum/Sudah Dikerjakan)
```

#### **4. Test Submit Tugas**

```
✓ Klik "Kerjakan" pada tugas yang belum dikerjakan
✓ Isi jawaban di text area
✓ Upload file (opsional)
✓ Klik "Kirim Tugas"
✓ Pastikan muncul toast success
✓ Pastikan status tugas berubah jadi "Sudah Dikirim"
```

#### **5. Test Lihat Submission**

```
✓ Klik "Lihat" pada tugas yang sudah dikerjakan
✓ Pastikan jawaban yang dikirim ditampilkan
✓ Pastikan file bisa didownload (jika ada)
✓ Pastikan feedback guru ditampilkan (jika ada)
✓ Pastikan nilai ditampilkan (jika ada)
```

---

## 🔐 Access Control Implementation

### **Konsep**:

Murid hanya bisa akses sesi yang **sudah dimulai**, tidak peduli apakah tugas sesi sebelumnya sudah selesai atau belum.

### **Implementasi**:

```typescript
// Di StudentKelasDetailClient.tsx
const today = new Date();
const sesiResult = await sesiApi.getSesiByKelas(kelasId, {
    to: today.toISOString().split('T')[0], // Hanya sesi sampai hari ini
    per_page: 100,
});
```

### **Contoh Skenario**:

```
Hari ini: 30 Januari 2026

Sesi 1 (20 Jan) - Sudah lewat ✓ Bisa diakses
Sesi 2 (27 Jan) - Sudah lewat ✓ Bisa diakses
Sesi 3 (30 Jan) - Hari ini   ✓ Bisa diakses
Sesi 4 (3 Feb)  - Belum      ✗ TIDAK bisa diakses
Sesi 5 (10 Feb) - Belum      ✗ TIDAK bisa diakses
```

---

## 📊 Flow Diagram

```
Student Login
     │
     ▼
/student/learning
(Lihat semua kelas)
     │
     ├─ Kelas A (Progress 60%, 2 tugas pending)
     ├─ Kelas B (Progress 80%, 0 tugas pending)
     └─ Kelas C (Progress 40%, 5 tugas pending)
          │
          ▼ [Klik "Lihat Detail"]
          │
/student/learning/[kelasId]
(Lihat sesi & tugas)
     │
     ├─ Sesi 3 (30 Jan) ✓ Bisa diakses
     │   ├─ Tugas 1: PR Matematika [Sudah Dikirim]
     │   └─ Tugas 2: Latihan Soal [Belum Dikerjakan]
     │        │
     │        ▼ [Klik "Kerjakan"]
     │        │
     │   Dialog Submit Tugas
     │        │
     │        ├─ Isi jawaban
     │        ├─ Upload file (opsional)
     │        └─ Klik "Kirim Tugas"
     │             │
     │             ▼
     │        Status berubah → [Sudah Dikirim]
     │             │
     │             ▼ [Klik "Lihat"]
     │             │
     │   Dialog Lihat Submission
     │        │
     │        ├─ Lihat jawaban
     │        ├─ Download file
     │        ├─ Lihat feedback guru
     │        └─ Lihat nilai
     │
     ├─ Sesi 2 (27 Jan) ✓ Bisa diakses
     └─ Sesi 1 (20 Jan) ✓ Bisa diakses
```

---

## 🚨 Troubleshooting

### **Halaman kosong / "Belum Ada Kelas"**

**Penyebab**: User yang login tidak memiliki enrollment aktif
**Solusi**:

1. Pastikan user adalah student (bukan admin)
2. Pastikan ada enrollment dengan status "Aktif"
3. Pastikan enrollment ter-link ke kelas

### **Tidak ada sesi yang muncul**

**Penyebab**: Semua sesi belum dimulai atau belum ada sesi
**Solusi**:

1. Buat sesi dengan tanggal di masa lalu atau hari ini
2. Pastikan sesi ter-link ke kelas yang benar

### **Tugas tidak muncul**

**Penyebab**: Tugas tidak ter-link ke sesi atau enrollment
**Solusi**:

1. Pastikan tugas di-assign ke enrollment yang benar
2. Pastikan tugas ter-link ke sesi (realisasi_jadwal_kerja_id)

### **Error saat submit tugas**

**Penyebab**: API endpoint tidak tersedia atau file terlalu besar
**Solusi**:

1. Cek console untuk error detail
2. Pastikan file < 10MB
3. Pastikan format file sesuai (PDF, DOC, DOCX, JPG, PNG)

---

## 🎨 UI/UX Highlights

### **Design Principles**:

1. ✅ **Student-Centric** - Fokus pada apa yang perlu murid lakukan
2. ✅ **Clear Status** - Badge warna untuk status tugas
3. ✅ **Visual Feedback** - Progress bar, alerts, toast notifications
4. ✅ **Access Control** - Hanya tampilkan yang bisa diakses
5. ✅ **Mobile Responsive** - Grid layout yang adaptif

### **Color Coding**:

- 🟠 **Orange** - Belum dikerjakan / Pending
- 🔵 **Blue** - Sudah dikirim / Submitted
- 🟢 **Green** - Sudah direview / Accepted
- 🔴 **Red** - Terlambat / Overdue

---

## 📝 Next Steps (Optional Enhancements)

### **Priority 1: Backend API**

- [ ] Endpoint untuk filter enrollment by current user
- [ ] Endpoint untuk submit assignment dengan file upload
- [ ] Endpoint untuk review submission (guru)

### **Priority 2: Additional Features**

- [ ] Notifikasi tugas baru
- [ ] Reminder deadline tugas
- [ ] Progress tracking per murid
- [ ] Leaderboard / gamification

### **Priority 3: Materi Module Integration**

- [ ] Tampilkan materi modul di detail sesi
- [ ] Video player untuk materi video
- [ ] PDF viewer untuk materi PDF
- [ ] Quiz interaktif

---

## 🎉 Summary

### **Yang Sudah Selesai**:

✅ Halaman pembelajaran murid (list kelas)
✅ Halaman detail kelas (list sesi & tugas)
✅ Dialog submit tugas (text + file)
✅ Dialog lihat submission (feedback & nilai)
✅ Access control berbasis waktu sesi
✅ Repository method untuk submit assignment

### **Cara Test**:

1. Login sebagai student
2. Navigate ke `/student/learning`
3. Klik "Lihat Detail" pada kelas
4. Klik "Kerjakan" pada tugas
5. Submit tugas
6. Lihat submission

### **Files Created**:

- `/src/app/(protected)/student/learning/page.tsx`
- `/src/app/(protected)/student/learning/[kelasId]/page.tsx`
- `/src/modules/learning/presentation/components/StudentLearningClient.tsx`
- `/src/modules/learning/presentation/components/StudentKelasDetailClient.tsx`
- `/src/modules/learning/presentation/components/SubmitAssignmentDialog.tsx`
- Updated: `/src/modules/learning/infrastructure/assignment.repository.ts`

**Terakhir diupdate**: 30 Januari 2026 - Student View Complete
