# 🚀 DEPLOYMENT GUIDE - Upload Folder Langsung (Tanpa Zip)

**Tanggal:** 29 Januari 2026, 22:30 WIB  
**Metode:** Upload folder langsung via FTP/cPanel/rsync

---

## 📋 Cara Deploy yang BENAR

### Step 1: Build di Local

```bash
# Di komputer local
cd /Volumes/The\ Vault/Projects/Shine-Education-Bali/app-shineedu

# Clean build
rm -rf .next

# Build production
npm run build
```

**Verifikasi build berhasil:**

- ✅ Folder `.next` terbuat
- ✅ Tidak ada error di terminal
- ✅ Muncul list routes yang di-build

### Step 2: Upload ke Server

**Pilih salah satu metode:**

#### Metode A: Via rsync (RECOMMENDED - Paling Cepat)

```bash
# Upload folder .next saja
rsync -avz --delete .next/ user@server:/path/to/app/.next/

# Upload file-file penting lainnya (jika ada perubahan)
rsync -avz server.js package.json package-lock.json next.config.ts user@server:/path/to/app/
```

**Keuntungan rsync:**

- ✅ Hanya upload file yang berubah
- ✅ Sangat cepat
- ✅ Bisa delete file lama yang tidak diperlukan
- ✅ Preserve permissions

#### Metode B: Via cPanel File Manager

1. Login ke cPanel
2. Buka **File Manager**
3. Navigate ke folder aplikasi
4. **Backup folder `.next` lama:**
    - Klik kanan folder `.next` → Rename → `.next_backup_20260129`
5. **Delete folder `.next` yang lama** (setelah backup)
6. **Upload folder `.next` yang baru:**
    - Klik **Upload**
    - Pilih semua file di folder `.next` local
    - Tunggu sampai selesai
7. **Verify** folder `.next` ter-upload lengkap

#### Metode C: Via FTP (FileZilla, dll)

1. Connect ke server via FTP
2. Navigate ke folder aplikasi
3. **Backup folder `.next` lama** (rename atau download)
4. **Delete folder `.next` lama**
5. **Upload folder `.next` baru** dari local
6. Tunggu sampai semua file ter-upload

### Step 3: Install Dependencies & Restart di Server

```bash
# SSH ke server
ssh user@server
cd /path/to/app

# Install/update dependencies (jika ada perubahan package.json)
npm install --production

# Restart aplikasi
pm2 restart app-shineedu

# Monitor logs
pm2 logs app-shineedu --lines 50
```

---

## ✅ Verifikasi Deployment

### 1. Cek di Server

```bash
# Cek apakah folder .next ada
ls -la .next/

# Cek apakah chunks ada dan tidak 0 bytes
ls -lh .next/static/chunks/*.js | head -10

# Harus muncul file dengan ukuran > 0
# Contoh:
# -rw-r--r-- 1 user user  40K Jan 29 22:28 xxx.js
```

### 2. Cek PM2

```bash
pm2 status
# Status harus: online

pm2 logs app-shineedu --lines 20
# Harus muncul: "> Ready on http://localhost:3000"
```

### 3. Test di Browser

Buka: https://app.shineeducationbali.com

- ✅ Halaman login muncul
- ✅ Tidak ada "Application error"
- ✅ Browser console tidak ada error 500
- ✅ Bisa login dan akses dashboard

---

## 🔧 Troubleshooting

### Problem: File masih 0 bytes setelah upload

**Penyebab:** Upload gagal atau corrupt

**Solusi:**

1. Delete folder `.next` di server
2. Upload ulang dengan metode berbeda (coba rsync jika sebelumnya pakai FTP)
3. Verifikasi ukuran file setelah upload

### Problem: PM2 error setelah restart

**Penyebab:** Dependencies tidak match atau environment issue

**Solusi:**

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install --production

# Restart
pm2 restart app-shineedu
```

### Problem: Masih error 500 di browser

**Penyebab:** File tidak ter-upload lengkap atau permissions salah

**Solusi:**

```bash
# Set permissions
chmod -R 755 .next
find .next/static/chunks -name "*.js" -exec chmod 644 {} \;

# Restart
pm2 restart app-shineedu

# Clear browser cache
# Di browser: Ctrl+Shift+Delete → Clear cache
# Hard reload: Ctrl+Shift+R
```

---

## 📝 Checklist

Sebelum declare berhasil:

- [ ] Build di local berhasil (`npm run build`)
- [ ] Folder `.next` lama di server sudah di-backup
- [ ] Folder `.next` baru sudah ter-upload lengkap
- [ ] File `.next/static/chunks/*.js` tidak ada yang 0 bytes
- [ ] `npm install --production` berhasil (jika perlu)
- [ ] PM2 status = `online`
- [ ] PM2 logs tidak ada error
- [ ] Browser tidak menampilkan "Application error"
- [ ] Browser console tidak ada error 500
- [ ] Bisa login dan akses dashboard

---

## 💡 Tips

1. **Gunakan rsync jika memungkinkan** - Paling cepat dan reliable
2. **Selalu backup dulu** - Rename folder `.next` lama sebelum upload yang baru
3. **Verify file size** - Pastikan file ter-upload dengan ukuran yang benar
4. **Monitor logs** - Selalu cek PM2 logs setelah restart
5. **Clear browser cache** - Setelah deploy, clear cache dan hard reload

---

## 🎯 Kesimpulan

**TIDAK PERLU:**

- ❌ Buat zip file
- ❌ Pakai bundle.sh
- ❌ Upload semua file project

**YANG PERLU:**

- ✅ Build di local: `npm run build`
- ✅ Upload folder `.next` ke server
- ✅ Restart PM2: `pm2 restart app-shineedu`

**Sederhana dan straightforward!**

---

_Last Updated: 29 Januari 2026, 22:30 WIB_
