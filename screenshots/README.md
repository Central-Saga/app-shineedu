# Screenshots — UI Redesign & Bugfix

## Perubahan

### Login (`login-redesign.png`)
- Layout 2 kolom desktop: kiri branding (/shine-logo.png, headline, 3 bullet, note), kanan card form
- Background: gradient white→slate-50, decorative blurred shapes (red-200/20, amber-200/20)
- Card: rounded-2xl, shadow-lg, border-slate-200/60, padding lega
- Input email: plain Input, type=email, autoComplete=email (fix tooltip "No items to show")
- Footer: © Shine Education

### Users table
- Header: bg-slate-50, text-slate-600. Row hover: bg-slate-50
- Action: Button ghost size=icon + Tooltip (Edit, Ubah Role, Hapus)
- Status: Aktif = badge hijau (emerald), Non Aktif = badge slate
- Role: badge accent gold (border-amber-300/80, bg-amber-50, text-amber-800)

### Roles — Permission Matrix
- **Layout:** Scroll di wrapper `max-h-[70vh] overflow-auto rounded-xl border bg-white`, BUKAN di table
- **Table:** `table-fixed`, Module w-[220px], tiap action w-[120px]
- **Sticky:** header th `sticky top-0 z-20 bg-slate-50`; kolom Module `sticky left-0 z-10 bg-white`
- Toolbar: search, "Selected: X", "Show selected only" (Switch), Select All / Clear All (icon)
- Row/col: All & Clear sebagai small Button ghost

### Permissions table
- Mengikuti base: header bg-slate-50, row hover, Card rounded-2xl

### Sidebar & Topbar
- **Sidebar:** /logo-tanpa-nama.png (ikon) + teks "Shine Edu"; MAIN / IDENTITY; active rounded-xl, bg-red-50, text-red-700
- **Topbar:** /logo-tanpa-nama.png + "Shine Edu Admin"; dropdown: nama, role badge gold, Logout

---

Untuk screenshot Users, Roles (matrix), Permissions: jalankan `npm run dev`, login, lalu buka `/users`, `/roles`, `/permissions`.
