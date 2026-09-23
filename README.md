# POS_PROGRAM

HotelOne — Integrated Hotel Management System untuk CHL Group (PT. Cipta Harmoni Lestari).

| Folder | Isi |
| --- | --- |
| `app/` | Aplikasi React + TypeScript + Vite — 11 layar (00 Login … 04 Finance). Lihat `app/README.md`. |
| `api/` | API serverless Vercel untuk transaksi POS (Postgres). |
| `shared/` | Menu, aturan pajak/service, dan tipe transaksi yang dipakai app dan API. |
| `project/` | Bundle desain dari Claude Design: `POS Program.html` (prototipe), design system Broadsheet, aset, PRD, dan `HANDOFF.md`. |
| `chats/` | Transkrip percakapan desain. |

## Menjalankan lokal

```bash
npm install                 # dependensi API (root)
cd app && npm install
cp .env.example .env.local  # isi DATABASE_URL, AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run dev                 # http://localhost:5173 (app + /api)
```

## Setup di Vercel

Transaksi dari layar **02F FD - POS Resto** (Charge to room, Tunai, QRIS, Kartu)
disimpan ke Postgres dan tampil di layar **04 Finance**. Semua API (kecuali `/api/health`) wajib login.

1. **Database:** Vercel → **Storage → Create Database → Neon (Postgres)**, hubungkan ke proyek
   `pos_program`. `DATABASE_URL` terisi otomatis. (Postgres lain juga bisa — isi `DATABASE_URL` sendiri.)
2. **Environment Variables** (Settings → Environment Variables):

   | Nama | Isi |
   | --- | --- |
   | `AUTH_SECRET` | Minimal 32 karakter acak, mis. hasil `openssl rand -base64 48`. Jangan dibagikan. |
   | `ADMIN_EMAIL` | Email administrator pertama |
   | `ADMIN_PASSWORD` | Password administrator pertama (minimal 8 karakter) |
   | `ADMIN_NAME` | (opsional) Nama administrator |

   Admin pertama hanya dibuat selama tabel user masih kosong. Setelah login pertama,
   `ADMIN_PASSWORD` boleh dihapus dari Vercel.
3. **Redeploy**. Tabel dibuat otomatis saat API pertama kali dipanggil.
4. Cek `https://<domain>/api/health` → `{"ok":true,"database":"connected","auth":"configured","users":"present"}`.

## Peran

| Peran | Simpan transaksi POS | Lihat Finance | Void | Kelola user |
| --- | :-: | :-: | :-: | :-: |
| `cashier` (Kasir) | ✓ | | | |
| `finance` (Finance) | | ✓ | | |
| `supervisor` (Supervisor) | ✓ | ✓ | ✓ | |
| `admin` (Administrator) | ✓ | ✓ | ✓ | ✓ |

Setiap transaksi mencatat siapa yang menyimpan dan siapa yang mem-void.

### Menambah user

Belum ada layar kelola user. Sementara lewat API — login sebagai admin di browser, lalu
jalankan di Console (F12) pada halaman aplikasi:

```js
await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "kasir1@ciptaharmoni.com", name: "Sari Handayani", role: "cashier", password: "min-8-karakter" }) }).then(r => r.json())
```

Ubah / nonaktifkan / reset password: `POST /api/admin/user-update` dengan `{ id, name?, role?, active?, password? }`.
Menonaktifkan user, mengganti peran, atau mengganti password langsung mengakhiri semua sesinya.

## Endpoint

| Endpoint | Akses | Fungsi |
| --- | --- | --- |
| `GET /api/health` | publik | Status API, database, dan login |
| `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me` | — | Sesi (cookie `HttpOnly`, 12 jam) |
| `GET /api/pos/transactions?date=YYYY-MM-DD&method=&status=` | finance, supervisor, admin | Transaksi satu hari (WIB) + ringkasan |
| `POST /api/pos/transactions` | cashier, supervisor, admin | Simpan transaksi — total dihitung ulang di server |
| `POST /api/pos/void` | supervisor, admin | Void dengan alasan (baris tetap disimpan) |
| `GET/POST /api/admin/users` · `POST /api/admin/user-update` | admin | Kelola user |

Keamanan: password di-hash scrypt; akun terkunci 15 menit setelah 5 kali salah password;
POST wajib `Content-Type: application/json` (mencegah CSRF). Tabel: `app_users`,
`pos_transactions`, `pos_transaction_items` (skema di `api/_lib/db.ts`).
