# 🎓 Shine Education Bali - Admin Panel

Admin panel untuk mengelola sistem pendidikan Shine Education Bali.

---

## 🚀 Getting Started

### Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 📚 Documentation

Semua dokumentasi project tersedia di folder **`docs/`**:

### **📘 Learning Management System** (Latest - 30 Jan 2026)

📁 **Path**: [`docs/learning-management-system/`](./docs/learning-management-system/)

**Fitur**:

- ✅ UI Standardization (Materi Modul & Assignments)
- ✅ Bulk Assignment (assign tugas ke banyak murid sekaligus)
- ✅ Student View (halaman untuk murid)

**Quick Links**:

- [📋 Summary](./docs/learning-management-system/SUMMARY.md) - Ringkasan development
- [⚡ Quick Start](./docs/learning-management-system/QUICK_START.md) - Quick reference
- [📖 Master Documentation](./docs/learning-management-system/MASTER_DOCUMENTATION.md) - Comprehensive guide

**Start Here**: [`docs/learning-management-system/README.md`](./docs/learning-management-system/README.md)

---

### **📂 All Documentation**

Lihat index lengkap: [`docs/README.md`](./docs/README.md)

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod
- **API Client**: Custom HTTP Client

---

## 📁 Project Structure

```
app-shineedu/
├── docs/                           📚 Documentation
│   ├── README.md                   Index semua dokumentasi
│   └── learning-management-system/ Dokumentasi LMS
│
├── src/
│   ├── app/                        Next.js App Router
│   │   ├── (auth)/                 Auth pages (login, etc)
│   │   └── (protected)/            Protected pages (dashboard, etc)
│   │
│   ├── modules/                    Business logic modules
│   │   ├── auth/                   Authentication
│   │   ├── academic/               Academic (Kelas, Program, Jenjang)
│   │   ├── enrollment/             Enrollment
│   │   ├── learning/               Learning (Materi, Tugas)
│   │   └── ...
│   │
│   ├── features/                   Shared features
│   │   ├── sesi/                   Session management
│   │   └── ...
│   │
│   ├── components/                 Shared components
│   │   └── ui/                     UI components (shadcn)
│   │
│   └── shared/                     Shared utilities
│       ├── infrastructure/         API, stores, etc
│       └── lib/                    Utilities
│
└── public/                         Static assets
```

---

## 🧪 Testing

### Quick Test - Bulk Assignment (5 menit)

```bash
# Navigate to:
http://app.shineeducationbali.test/dashboard/assignments/create

# Test:
✓ Pilih kelas
✓ Pilih "Pilih Semua" untuk murid
✓ Isi detail tugas
✓ Klik "Buat [N] Tugas"
```

### Quick Test - Student View (10 menit)

```bash
# Prasyarat: Buat user student, enrollment, kelas, sesi, tugas

# Navigate to:
http://app.shineeducationbali.test/student/learning

# Test:
✓ Lihat card kelas
✓ Klik "Lihat Detail"
✓ Klik "Kerjakan" pada tugas
✓ Submit tugas
```

**Detail Testing**: Lihat [`docs/learning-management-system/MASTER_DOCUMENTATION.md`](./docs/learning-management-system/MASTER_DOCUMENTATION.md)

---

## 📞 Support

Jika ada pertanyaan atau butuh bantuan:

1. Baca dokumentasi yang relevan di folder `docs/`
2. Cek section Troubleshooting di dokumentasi
3. Hubungi tim development

---

## 🆕 Latest Updates

### **30 Januari 2026** - Learning Management System

- ✅ UI Standardization
- ✅ Bulk Assignment Feature (penghematan waktu ~85%!)
- ✅ Student View Complete
- 📚 7 comprehensive documentation files

**Detail**: [`docs/learning-management-system/SUMMARY.md`](./docs/learning-management-system/SUMMARY.md)

---

## 📖 Learn More

To learn more about Next.js:

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)

---

**Last Updated**: 30 Januari 2026, 11:07 WIB
