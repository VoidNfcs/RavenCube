# Premku WA Bot

WhatsApp bot untuk menjual produk dan layanan secara otomatis menggunakan **premku.com API v2.0** dan **Baileys** (Node.js).

## Fitur

- Autentikasi via QR code WhatsApp Web
- Cek profil akun, saldo, dan WhatsApp terdaftar
- Daftar produk + harga + stok
- Cek stok produk realtime
- Order produk dengan alur pembayaran: konsumen request order → bot buat QRIS via `/pay` → **polling otomatis** `/pay_status` → jika sukses baru jalankan `/order` (dengan `ref_id` untuk idempotency)
- Cek status order / invoice
- Layanan Alight Motion: `buy_bulk`, `buy_single`, `verify_single`, `cancel_single`
- Deposit saldo via QRIS (`/pay`, `/paystatus`, `/cancelpay`)
- Riwayat order & pembayaran tersimpan di **SQLite lokal** (`/history`)
- Whitelist nomor (opsional)

## Prasyarat

- Node.js v18+ (disarankan v20+)
- API key dari premku.com

## Instalasi

```bash
npm install
```

## Konfigurasi

```bash
cp .env.example .env
```

Isi file `.env`:

```env
# Premku.com API
PREMKU_API_KEY=YOUR_KEY_HERE
PREMKU_BASE_URL=https://premku.com/api

# WhatsApp bot
BOT_NAME=Premku Bot
PREFIX=/

# Daftar nomor yang boleh memakai bot (format internasional, tanpa +). Kosongkan untuk semua orang.
ALLOWED_NUMBERS=

# Direktori penyimpanan session
SESSION_DIR=./session

# Database SQLite (Prisma). Path relatif terhadap folder prisma/.
DATABASE_URL=file:./dev.db

# Polling status pembayaran (ms). 0 = pakai nilai default 5000.
POLL_INTERVAL_MS=5000

# Timeout tunggu pembayaran (detik). 0 = pakai expired_in dari API.
PAY_TIMEOUT_SECONDS=0
```

## Menjalankan migrasi database (Prisma)

```bash
npx prisma migrate deploy
```

Untuk mengubah skema: edit `prisma/schema.prisma`, lalu `npx prisma migrate dev --name <nama>`.

## Menjalankan

```bash
npm start
```

Setelah dijalankan, scan QR code yang muncul di terminal menggunakan WhatsApp (menu *Linked Devices* → *Link a Device*). Session akan disimpan di `./session` sehingga Anda tidak perlu scan ulang pada run berikutnya.

## Perintah Bot

| Perintah | Fungsi |
| -------- | ------ |
| `/help` | Daftar perintah |
| `/profile` | Cek profil akun, saldo, WhatsApp |
| `/products` | Daftar produk + harga + stok |
| `/stock <product_id>` | Cek stok produk realtime |
| `/order <product_id> <qty>` | Request order → buat QRIS → order diproses otomatis saat pembayaran sukses |
| `/status <invoice>` | Cek status order |
| `/am buybulk <qty 1-200> [ref_id]` | Generate akun Alight Motion (bulk) |
| `/am buysingle <email>` | Kirim link verifikasi Alight Motion |
| `/am verify <invoice> <email> <link>` | Verifikasi link Alight Motion |
| `/am cancel <invoice>` | Batalkan request Alight Motion pending |
| `/pay <amount>` | Deposit saldo via QRIS |
| `/paystatus <invoice>` | Cek status pembayaran |
| `/cancelpay <invoice>` | Batalkan deposit pending |
| `/history` | Riwayat order & pembayaran lokal |

Contoh percakapan (alur order):

```
/products          → melihat daftar produk
/order P123 2      → minta beli 2 unit; bot buat QRIS dan menunggu pembayaran
[user bayar QRIS]  → bot polling /pay_status → sukses → order diproses otomatis
/status INV-xxxx   → cek status pesanan
/pay 100000        → deposit 100.000 via QRIS
/paystatus PAY-xxx → cek status deposit
/history           → riwayat order & pembayaran lokal
```

## Struktur Project

```text
src/
├── index.js              # Entry point
├── config.js             # Konfigurasi dari environment
├── api/
│   └── premku.js         # Client API premku.com (semua endpoint)
├── db/
│   └── index.js          # Prisma Client + helper (payment & order)
├── services/
│   └── paymentPoller.js  # Polling /pay_status → eksekusi /order saat paid
├── whatsapp/
│   └── client.js         # Koneksi Baileys + autentikasi + reconnect
├── handlers/
│   ├── message.js        # Router perintah
│   └── messageText.js    # Ekstraksi teks pesan
├── commands/             # Implementasi tiap perintah
│   ├── index.js          # Registri & pencarian perintah
│   ├── profile.js
│   ├── products.js
│   ├── stock.js
│   ├── order.js          # Alur: produk → /pay → QRIS → polling
│   ├── status.js
│   ├── am.js
│   ├── pay.js
│   ├── paystatus.js
│   ├── cancelpay.js
│   ├── history.js
│   └── help.js
└── utils/
    └── format.js         # Utilitas format angka/rupiah/waktu

prisma/
├── schema.prisma         # Model Payment & Order (SQLite)
└── migrations/           # Migrasi database
```

## Catatan Integrasi API

- Semua request memakai `POST` ke `PREMKU_BASE_URL` dengan body JSON `{ api_key, ... }`.
- **Alur order**: konsumen `/order` → bot hit `/pay` (QRIS) → polling `/pay_status` → jika sukses baru menjalankan `/order` API. Jika tidak bayar sampai batas waktu, pembayaran ditandai `expired` dan dibatalkan.
- `/order` selalu mengirim `ref_id` yang sama sejak pembuatan payment untuk menjamin idempotency (retry tidak membuat transaksi ganda).
- Kode unik (`kode_unik`) dari `/pay` otomatis ditambahkan ke `total_bayar`.
- Endpoint Alight Motion konsisten mengikuti spesifikasi `/am` (bukan `am_tools`).

## Database (Prisma + SQLite)

- Skema: `prisma/schema.prisma` (model `Payment` & `Order`).
- Migrasi: `npm run db:migrate` (deploy) atau `npm run db:dev` (dev, otomatis buat migrasi baru).
- Explorer: `npm run db:studio`.
- File DB dibuat di `prisma/dev.db` sesuai `DATABASE_URL` di `.env`.

## Troubleshooting

- **Bot tidak merespon**: pastikan bot tidak dimulai dua kali (session `./session` dipakai oleh dua proses akan konflik).
- **QR muncul terus setelah scan**: hapus folder `./session` dan scan ulang.
- **`PREMKU_API_KEY belum diatur`**: copy `.env.example` ke `.env` dan isi API key Anda.

## Disclaimer

Project ini hanya client API. Pastikan penggunaan sesuai dengan ketentuan layanan premku.com. Penyimpanan API key dilakukan sepenuhnya di environment milik Anda (`PREMKU_API_KEY`), tidak pernah di-hardcode di kode.
