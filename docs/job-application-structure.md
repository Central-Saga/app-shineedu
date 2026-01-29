# Job Application – Clean Structure

Struktur bersih untuk fitur **Job Applications** di app-shineedu (protected CRUD) dan landing-shineedu (halaman lamaran publik).

---

## 1. Ringkasan

| Area                | Lokasi           | Fungsi                                                                                                                                                                                 |
| ------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Landing**         | landing-shineedu | Halaman publik `/job-applications`: Hero, Tabs (Form lamaran + Cek status), FAQ. Form kirim lamaran (nama, email, telepon, posisi, pengalaman, pendidikan, alamat, CV, surat lamaran). |
| **App (Protected)** | app-shineedu     | CRUD admin: daftar lamaran, detail, edit status. Menu di sidebar HR → Lamaran Kerja.                                                                                                   |

---

## 2. Landing (landing-shineedu)

### Route & Halaman

- **URL:** `/job-applications`
- **File:** `app/(landing)/job-applications/page.tsx`
- **Layout:** `LandingPageLayout` + Hero, Tabs, FAQ

### Komponen

- `components/(landing)/(job)/job-applications/`
  - `JobApplicationsHero.tsx` – Hero section
  - `JobApplicationsTabs.tsx` – Tab: Form lamaran & Cek status
  - `JobApplicationForm.tsx` – Form kirim lamaran (nama, email, telepon, posisi, pengalaman, pendidikan, alamat, CV, surat lamaran)
  - `TrackApplicationForm.tsx` – Cek status lamaran (tracking code)
  - `JobApplicationsFaq.tsx` – FAQ
  - `index.ts` – re-export

### Data

- **Posisi tersedia:** `data/(landing)/(job)/job-applications/job-applications.ts`
  - `AvailablePosition`: id, title, location
  - `availablePositions` – daftar posisi untuk dropdown form

### Alur ke Depan

- Form lamaran di landing mengirim ke API (mis. `POST /api/v2/job-applications`).
- Setelah API tersedia di api-shineedu, form bisa pakai endpoint yang sama dengan app-shineedu (repository `job-applications`).

---

## 3. App Protected (app-shineedu)

### Route

- **List:** `/job-applications` → `app/(protected)/job-applications/page.tsx`
- **Detail:** `/job-applications/[id]` → `app/(protected)/job-applications/[id]/page.tsx`
- **Edit:** `/job-applications/[id]/edit` → `app/(protected)/job-applications/[id]/edit/page.tsx`

### Module: `src/modules/job-application/`

```
job-application/
├── domain/
│   └── entities.ts          # JobApplication, Create/Update payload, status, experience, education
├── infrastructure/
│   └── job-application.repository.ts   # list, get, create, update, delete (API job-applications)
└── presentation/
    └── components/
        ├── JobApplicationTable.tsx      # Tabel list + aksi (lihat, edit, hapus, link CV)
        └── JobApplicationEditForm.tsx  # Form edit status (pending/reviewed/shortlisted/rejected/hired)
```

### Entity (selaras dengan form landing)

- **JobApplication:** id, first_name, last_name, email, phone, position_id, experience, education, address, resume_url, cover_letter_url, status, tracking_code, created_at, updated_at, position (relation).
- **Status:** pending | reviewed | shortlisted | rejected | hired
- **Experience:** fresh-graduate | 1-2 | 3-5 | 5-10 | 10+
- **Education:** sma | d3 | s1 | s2 | s3

### Permission

- `job_application.view` – list & detail
- `job_application.update` – edit (status)
- `job_application.delete` – hapus
- `job_application.create` – (opsional, untuk input manual di admin)

### Sidebar

- **HR** → **Lamaran Kerja** (`/job-applications`), icon Briefcase, permission `job_application.view`.

### API (backend yang diharapkan)

- `GET /api/v2/job-applications` – list (paginated, filter status, q)
- `GET /api/v2/job-applications/:id` – detail
- `POST /api/v2/job-applications` – create (form landing atau admin)
- `PUT /api/v2/job-applications/:id` – update
- `DELETE /api/v2/job-applications/:id` – delete

---

## 4. Konsistensi Landing ↔ App

- **Field form landing** = field entity JobApplication (first_name, last_name, email, phone, position_id, experience, education, address, resume, cover_letter).
- **Posisi** di landing saat ini dari data statis `availablePositions`; ke depan bisa dari API (job-vacancies/positions) yang sama dengan dropdown di app.
- **Status** hanya di app (admin); landing hanya kirim lamaran dan cek status via tracking code.

---

## 5. Backend (api-shineedu) – ke depan

Untuk mengaktifkan penuh fitur ini:

1. Migration: tabel `job_applications` (dan relasi `job_vacancies` / positions jika perlu).
2. Model & Controller: JobApplication, CRUD + upload file CV/cover letter.
3. Route API v2: seperti di atas.
4. Seeder/role: permission `job_application.view`, `job_application.update`, `job_application.delete` (dan optional `job_application.create`).

Setelah API siap, repository di app-shineedu dan form di landing-shineedu bisa diarahkan ke base URL API yang sama.
