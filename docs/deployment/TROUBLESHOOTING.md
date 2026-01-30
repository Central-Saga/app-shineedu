# 🚨 TROUBLESHOOTING - Error 500 pada JavaScript Files

**Error:** "Application error: a client-side exception has occurred"  
**Root Cause:** File JavaScript di `.next/static/chunks/` gagal dimuat (Status 500)  
**Tanggal:** 29 Januari 2026, 22:24 WIB

---

## 🔍 Diagnosis Error

Berdasarkan investigasi browser console:

- ❌ `/_next/static/chunks/4546e76434e246c6.js` - **Status 500**
- ❌ `/_next/static/chunks/b82a4a77131cbe18.js` - **Status 500**

**Artinya:** File-file JavaScript yang dibutuhkan oleh Next.js **tidak ada** atau **tidak bisa diakses** di server.

---

## 🎯 Solusi Cepat (Recommended)

### Opsi 1: Menggunakan Script Otomatis

Saya sudah buatkan script `fix-deployment.sh` yang akan:

1. ✅ Backup folder `.next` yang lama
2. ✅ Hapus file-file lama
3. ✅ Extract `app-shineedu.zip` dengan benar
4. ✅ Set permissions yang tepat
5. ✅ Install dependencies
6. ✅ Restart PM2

**Cara pakai:**

```bash
# 1. Upload file ke server (dari local)
scp app-shineedu.zip fix-deployment.sh user@server:/path/to/app/

# 2. SSH ke server
ssh user@server
cd /path/to/app

# 3. Jalankan script
chmod +x fix-deployment.sh
./fix-deployment.sh
```

### Opsi 2: Manual Step-by-Step

Jika Anda lebih suka manual, ikuti langkah ini:

```bash
# SSH ke server
ssh user@server
cd /path/to/app

# 1. STOP aplikasi dulu
pm2 stop app-shineedu

# 2. HAPUS TOTAL folder .next yang lama
rm -rf .next

# 3. HAPUS file-file lama
rm -f server.js next.config.ts next-env.d.ts package.json package-lock.json
rm -rf public

# 4. Extract zip FRESH
unzip -o app-shineedu.zip

# 5. VERIFIKASI file JavaScript ada
ls -lh .next/static/chunks/*.js | head -10

# Harus muncul banyak file .js dengan ukuran > 0 bytes
# Contoh output yang BENAR:
# -rw-r--r-- 1 user user  40K Jan 29 22:04 d7e83be674c0482d.js
# -rw-r--r-- 1 user user  35K Jan 29 22:04 c7c06815e19936ad.js
# dst...

# 6. Set permissions
chmod -R 755 .next
find .next/static/chunks -name "*.js" -exec chmod 644 {} \;

# 7. Install dependencies
npm install --production

# 8. Restart aplikasi
pm2 restart app-shineedu

# 9. Cek logs
pm2 logs app-shineedu --lines 50
```

---

## 🔎 Verifikasi Setelah Deploy

### 1. Cek File di Server

```bash
# Cek apakah folder .next ada
ls -la .next/

# Cek apakah folder chunks ada dan berisi file
ls -lh .next/static/chunks/ | head -20

# Hitung jumlah file JavaScript
find .next/static/chunks -name "*.js" | wc -l
# Harus > 50 files
```

**Output yang BENAR:**

```
-rw-r--r-- 1 user user  40854 Jan 29 22:04 d7e83be674c0482d.js
-rw-r--r-- 1 user user  35832 Jan 29 22:04 c7c06815e19936ad.js
-rw-r--r-- 1 user user  18854 Jan 29 22:04 fa56a32c5020804e.js
...
```

**Output yang SALAH:**

```
-rw-r--r-- 1 user user      0 Jan 29 22:04 d7e83be674c0482d.js  ← 0 bytes!
-rw-r--r-- 1 user user      0 Jan 29 22:04 c7c06815e19936ad.js  ← 0 bytes!
```

### 2. Cek PM2 Status

```bash
pm2 status
```

**Output yang BENAR:**

```
┌─────┬──────────────┬─────────┬─────────┬─────────┐
│ id  │ name         │ status  │ restart │ uptime  │
├─────┼──────────────┼─────────┼─────────┼─────────┤
│ 0   │ app-shineedu │ online  │ 0       │ 2m      │
└─────┴──────────────┴─────────┴─────────┴─────────┘
```

### 3. Cek Logs

```bash
pm2 logs app-shineedu --lines 50
```

**Output yang BENAR:**

```
> Ready on http://localhost:3000
```

**Output yang SALAH:**

```
Error: Cannot find module '.next/...'
ENOENT: no such file or directory
```

### 4. Test di Browser

Buka: https://app.shineeducationbali.com

**Cek di Browser Console (F12):**

- ✅ Tidak ada error 500
- ✅ Semua file `.js` loaded dengan status 200
- ✅ Halaman login muncul dengan benar

---

## ⚠️ Kemungkinan Masalah & Solusi

### Problem 1: File masih 0 bytes setelah extract

**Penyebab:** Zip file corrupt atau proses extract gagal

**Solusi:**

```bash
# Hapus zip dan download ulang
rm app-shineedu.zip

# Upload ulang dari local
# (dari komputer local)
scp app-shineedu.zip user@server:/path/to/app/

# Extract dengan verbose untuk lihat progress
unzip -v app-shineedu.zip | grep ".next/static/chunks"
```

### Problem 2: Permission denied

**Penyebab:** User tidak punya akses ke file

**Solusi:**

```bash
# Set ownership (ganti 'username' dengan user Anda)
chown -R username:username .next

# Set permissions
chmod -R 755 .next
```

### Problem 3: PM2 tidak restart

**Penyebab:** PM2 process stuck atau error

**Solusi:**

```bash
# Delete dan start ulang
pm2 delete app-shineedu
pm2 start server.js --name app-shineedu

# Atau restart semua
pm2 restart all
```

### Problem 4: Masih error 500 setelah semua langkah

**Penyebab:** Server cache atau CDN cache

**Solusi:**

```bash
# Clear PM2 logs
pm2 flush

# Restart dengan --update-env
pm2 restart app-shineedu --update-env

# Jika pakai Nginx/Apache, restart juga
sudo systemctl restart nginx
# atau
sudo systemctl restart apache2
```

**Di browser:**

- Clear browser cache (Ctrl+Shift+Delete)
- Hard reload (Ctrl+Shift+R atau Cmd+Shift+R)
- Coba di Incognito/Private mode

---

## 🔧 Debug Commands

Jika masih error, jalankan commands ini dan kirim outputnya:

```bash
# 1. Cek struktur folder
tree -L 3 .next/ | head -50

# 2. Cek ukuran file chunks
du -sh .next/static/chunks/

# 3. Cek permissions
ls -la .next/static/chunks/ | head -10

# 4. Cek apakah file bisa dibaca
cat .next/static/chunks/turbopack-*.js | head -5

# 5. Cek PM2 logs lengkap
pm2 logs app-shineedu --lines 100 --nostream

# 6. Cek environment variables
pm2 env 0  # ganti 0 dengan ID process app-shineedu

# 7. Test server langsung
curl -I http://localhost:3000/_next/static/chunks/turbopack-bb312a7da83c5ce4.js
```

---

## 📞 Jika Masih Gagal

Jika setelah semua langkah di atas masih gagal, kemungkinan ada masalah di:

1. **Server configuration** - Nginx/Apache tidak dikonfigurasi dengan benar untuk serve static files
2. **Node.js version** - Versi Node.js di server berbeda dengan local
3. **Environment variables** - Ada env variable yang missing atau salah

**Langkah terakhir:**

```bash
# Cek Node.js version
node --version
# Harus >= 18.x

# Cek npm version
npm --version

# Cek environment
echo $NODE_ENV
# Harus: production

# Test run manual (tanpa PM2)
NODE_ENV=production node server.js
# Biarkan running, test di browser
```

---

## ✅ Checklist Deployment

Sebelum declare "berhasil", pastikan:

- [ ] File `app-shineedu.zip` ter-upload dengan benar
- [ ] Folder `.next` lama sudah di-backup/hapus
- [ ] Extract zip berhasil tanpa error
- [ ] File `.next/static/chunks/*.js` ada dan ukurannya > 0 bytes
- [ ] Permissions sudah benar (755 untuk folder, 644 untuk files)
- [ ] `npm install --production` berhasil
- [ ] PM2 status = `online`
- [ ] PM2 logs tidak ada error
- [ ] Browser bisa load halaman tanpa "Application error"
- [ ] Browser console tidak ada error 500
- [ ] Bisa login dan akses dashboard

---

**Last Updated:** 29 Januari 2026, 22:26 WIB
