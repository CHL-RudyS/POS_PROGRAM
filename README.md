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
cp .env.example .env.local  # isi DATABASE_URL
npm run dev                 # http://localhost:5173 (app + /api)
```

## Database (Vercel)

Transaksi dari layar **02F FD - POS Resto** (Charge to room, Tunai, QRIS, Kartu)
disimpan ke Postgres dan tampil di layar **04 Finance**.

1. Di Vercel: **Storage → Create Database → Neon (Postgres)**, lalu hubungkan ke proyek
   `pos_program`. Vercel otomatis mengisi `DATABASE_URL`.
   (Postgres lain juga bisa — isi `DATABASE_URL` sendiri di **Settings → Environment Variables**.)
2. **Redeploy**. Tabel dibuat otomatis saat API pertama kali dipanggil.
3. Cek: buka `https://<domain>/api/health` → `{"ok":true,"database":"connected"}`.

| Endpoint | Fungsi |
| --- | --- |
| `GET /api/health` | Status API dan koneksi database |
| `GET /api/pos/transactions?date=YYYY-MM-DD&method=&status=` | Daftar transaksi satu hari (WIB) + ringkasan |
| `POST /api/pos/transactions` | Simpan transaksi — total dihitung ulang di server |
| `POST /api/pos/void` | Void transaksi dengan alasan (baris tetap disimpan untuk audit) |

Tabel: `pos_transactions` dan `pos_transaction_items` (skema di `api/_lib/db.ts`).

> **Belum ada login di sisi server.** Siapa pun yang tahu URL-nya bisa memanggil API ini.
> Sebelum dipakai dengan data sungguhan, API perlu autentikasi (dan otorisasi supervisor untuk void).
