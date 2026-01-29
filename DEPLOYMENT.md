# 📦 Panduan Deployment App ShineEdu

## 🔧 Prasyarat

Pastikan Anda sudah:

1. ✅ Melakukan commit semua perubahan code
2. ✅ Berada di branch yang benar (biasanya `dev` atau `main`)
3. ✅ Sudah install semua dependencies dengan `npm install`

## 🚀 Langkah-langkah Build & Bundle

### 1️⃣ Clean Build (Hapus build lama)

```bash
# Hapus folder .next yang lama
rm -rf .next

# Hapus zip bundle yang lama (opsional)
rm -f app-shineedu.zip
```

### 2️⃣ Build Production Bundle

```bash
# Jalankan build dan bundle sekaligus
npm run build:bundle
```

Script ini akan:

- ✅ Menjalankan `next build` untuk membuat production build
- ✅ Membuat file `app-shineedu.zip` yang berisi semua file yang diperlukan

### 3️⃣ Verifikasi Bundle

Setelah build selesai, pastikan:

```bash
# Cek ukuran file zip (harus > 10MB)
ls -lh app-shineedu.zip

# Cek isi zip (opsional)
unzip -l app-shineedu.zip | head -20
```

**File yang HARUS ada di dalam zip:**

- ✅ `.next/` folder (berisi build production)
- ✅ `package.json`
- ✅ `server.js`
- ✅ `next.config.ts`
- ✅ `public/` folder (jika ada assets)

**File yang TIDAK boleh ada:**

- ❌ `node_modules/` (akan di-install di server)
- ❌ `src/` (source code tidak diperlukan di production)
- ❌ `.git/` (version control tidak diperlukan)

## 📤 Upload ke Server

### Opsi 1: Manual Upload (cPanel/FTP)

1. Login ke cPanel atau FTP
2. Hapus semua file lama di folder aplikasi
3. Upload `app-shineedu.zip`
4. Extract zip file
5. Install dependencies:
    ```bash
    npm install --production
    ```
6. Restart aplikasi (PM2/Node):
    ```bash
    pm2 restart app-shineedu
    # atau
    pm2 start server.js --name app-shineedu
    ```

### Opsi 2: Via SSH

```bash
# Upload file
scp app-shineedu.zip user@server:/path/to/app/

# SSH ke server
ssh user@server

# Masuk ke folder aplikasi
cd /path/to/app/

# Backup folder lama (opsional tapi recommended)
mv .next .next_backup_$(date +%Y%m%d_%H%M%S)

# Extract zip
unzip -o app-shineedu.zip

# Install dependencies
npm install --production

# Restart aplikasi
pm2 restart app-shineedu
```

## 🔍 Troubleshooting

### Problem: File JavaScript 0 kB atau error 500

**Penyebab:** Build tidak lengkap atau corrupt

**Solusi:**

```bash
# 1. Hapus semua build artifacts
rm -rf .next .next_bundle .next_old app-shineedu.zip

# 2. Clean npm cache
npm cache clean --force

# 3. Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# 4. Build ulang
npm run build:bundle
```

### Problem: "Module not found" di production

**Penyebab:** Dependencies tidak ter-install di server

**Solusi:**

```bash
# Di server, jalankan:
npm install --production
```

### Problem: Environment variables tidak terbaca

**Penyebab:** File `.env` tidak ter-upload atau tidak dikonfigurasi

**Solusi:**

1. Jangan masukkan `.env` ke dalam zip (security risk)
2. Buat `.env.production` langsung di server dengan nilai yang sesuai
3. Atau set environment variables via PM2 ecosystem file

## 📝 Checklist Deployment

Sebelum upload ke production, pastikan:

- [ ] Code sudah di-commit dan di-push ke repository
- [ ] Sudah menjalankan `npm run build:bundle` dengan sukses
- [ ] File `app-shineedu.zip` sudah dibuat dan ukurannya wajar (> 10MB)
- [ ] Sudah backup folder `.next` yang lama di server (jika ada)
- [ ] Environment variables sudah dikonfigurasi di server
- [ ] Database migrations sudah dijalankan (jika ada perubahan schema)
- [ ] Sudah test di local dengan `npm run start` sebelum upload

## 🎯 Best Practices

1. **Selalu backup sebelum deploy** - Simpan folder `.next` lama dengan timestamp
2. **Test di local dulu** - Jalankan `npm run start` untuk test production build
3. **Gunakan PM2** - Untuk auto-restart dan monitoring
4. **Monitor logs** - Cek `pm2 logs app-shineedu` setelah deployment
5. **Gradual rollout** - Test di staging environment dulu jika memungkinkan

## 🆘 Rollback

Jika deployment gagal:

```bash
# Di server
cd /path/to/app/

# Restore backup
rm -rf .next
mv .next_backup_YYYYMMDD_HHMMSS .next

# Restart
pm2 restart app-shineedu
```

---

**Catatan Penting:**

- Jangan pernah edit `next.config.ts` atau `bundle.sh` tanpa testing yang matang
- Perubahan pada build configuration bisa menyebabkan production failure
- Selalu test build locally dengan `npm run build:bundle` sebelum deploy
