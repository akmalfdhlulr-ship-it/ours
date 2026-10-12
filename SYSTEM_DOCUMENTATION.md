# OURS — Panduan Komprehensif Arsitektur, Sistem & Alur Kerja (Workflows)

> **OURS** adalah aplikasi *lifestyle & relationship* premium untuk pasangan modern (*Mobile iOS, Android, dan Responsive Web*). Dibangun menggunakan arsitektur **Modular Monolith** dengan prinsip desain **Modern Editorial × Playful 3D × Fluid Motion**, serta perlindungan privasi ketat (*Bilateral Data Isolation & Mutual Blind Reveal*).

---

## DAFTAR ISI
1. [Ringkasan Ekosistem & Monorepo](#1-ringkasan-ekosistem--monorepo)
2. [Arsitektur Backend (NestJS Modular Monolith)](#2-arsitektur-backend-nestjs-modular-monolith)
3. [Arsitektur Frontend (Expo SDK 57 + React Native)](#3-arsitektur-frontend-expo-sdk-57--react-native)
4. [Arsitektur Database (PostgreSQL 16 + Prisma ORM)](#4-arsitektur-database-postgresql-16--prisma-orm)
5. [Mesin OCR Struk & Integrasi AI (Gemini 3.8 Flash)](#5-mesin-ocr-struk--integrasi-ai-gemini-38-flash)
6. [Alur Kerja Lengkap (End-to-End User Workflows)](#6-alur-kerja-lengkap-end-to-end-user-workflows)
   - [Workflow 1: Registrasi & Atomic Double-Secret Pairing](#workflow-1-registrasi--atomic-double-secret-pairing)
   - [Workflow 2: Shared Home & Kehadiran Pasangan](#workflow-2-shared-home--kehadiran-pasangan)
   - [Workflow 3: Eksplorasi Tempat (Places) & Wishlist Bersama](#workflow-3-eksplorasi-tempat-places--wishlist-bersama)
   - [Workflow 4: Penyusunan Rencana Kencan (Date Planner)](#workflow-4-penyusunan-rencana-kencan-date-planner)
   - [Workflow 5: AI Date Architect (Google Gemini 3.8 Flash)](#workflow-5-ai-date-architect-google-gemini-38-flash)
   - [Workflow 6: Eksekusi Kencan, Visits & Mutual Blind Reviews](#workflow-6-eksekusi-kencan-visits--mutual-blind-reviews)
   - [Workflow 7: Dompet Bersama 50:50 & Scan Struk Otomatis (OCR)](#workflow-7-dompet-bersama-5050--scan-struk-otomatis-ocr)
   - [Workflow 8: Interactive Scrapbook, Album & On This Day](#workflow-8-interactive-scrapbook-album--on-this-day)
   - [Workflow 9: Surat Cinta Digital (Love Letters)](#workflow-9-surat-cinta-digital-love-letters)
   - [Workflow 10: Kapsul Waktu Terkunci Sisi Server (Time Capsules)](#workflow-10-kapsul-waktu-terkunci-sisi-server-time-capsules)
   - [Workflow 11: Target Hubungan (Couple Goals) & Polling Keputusan (Decisions)](#workflow-11-target-hubungan-couple-goals--polling-keputusan-decisions)
   - [Workflow 12: Permainan Pasangan (Games) & Refleksi Harian (Daily Spark)](#workflow-12-permainan-pasangan-games--refleksi-harian-daily-spark)
   - [Workflow 13: OURS Wrapped (Kilas Balik Tahunan)](#workflow-13-ours-wrapped-kilas-balik-tahunan)
   - [Workflow 14: Archive-First Unpairing (Pemisahan Aman)](#workflow-14-archive-first-unpairing-pemisahan-aman)
7. [Keamanan, Privasi & Invarian Domain](#7-keamanan-privasi--invarian-domain)
8. [Panduan Menjalankan & Memverifikasi Proyek](#8-panduan-menjalankan--memverifikasi-proyek)

---

## 1. Ringkasan Ekosistem & Monorepo

OURS dikelola menggunakan **pnpm workspaces** dan **Turborepo** dengan pemisahan tanggung jawab yang terisolasi ketat:

```
ours/
├── apps/
│   ├── app/                    # Expo SDK 57 + React Native (iOS, Android, Web Responsif)
│   ├── api/                    # NestJS Modular Monolith API (/api/v1)
│   └── worker/                 # Background Processor Stub (BullMQ / Redis)
├── packages/
│   ├── database/               # Prisma ORM Schema (21 models) & Prisma Client
│   ├── contracts/              # DTOs, Request/Response Interface, Validasi Zod
│   ├── core/                   # Domain Enums, Konstanta, Error Types, Config
│   ├── design-tokens/          # Token Desain Visual (Warna Editorial, Tipografi, Spacing)
│   └── config/                 # Shared TSConfig, ESLint, Prettier
├── infrastructure/             # Docker Compose (PostgreSQL 16, Redis 7)
├── docs/                       # Spesifikasi Lengkap (Product, Architecture, Design, Domain)
├── SYSTEM_DOCUMENTATION.md    # Dokumen ini (Arsitektur & Panduan Operasional)
└── AGENTS.md                   # Invarian Rekayasa Workspace
```

### Invarian Monorepo Kritis:
- Dependensi backend seperti `Prisma`, `@nestjs/*`, atau driver database **dilarang keras diimpor ke aplikasi mobile (`apps/app`)**.
- Kontrak data dan antarmuka komunikasi antar-aplikasi hanya boleh diimpor dari `@ours/contracts`, `@ours/core`, dan `@ours/design-tokens`.

---

## 2. Arsitektur Backend (NestJS Modular Monolith)

Backend OURS menggunakan framework **NestJS** yang diorganisasi secara modular monolith dengan pola layering ketat:

$$\text{HTTP Request} \longrightarrow \text{Guards} \longrightarrow \text{Controller} \longrightarrow \text{Application Service} \longrightarrow \text{Domain Logic / Persistence}$$

### 2.1 Modul-Modul Backend
1. **AuthModule:** Registrasi pengguna (Argon2id), verifikasi email token HMAC, login & sliding session token (15 menit window, 30 hari expiry), reset password.
2. **SpacesModule:** Lifecycle *Couple Space*, multi-tenancy, batasan tepat 2 anggota, status space (`ACTIVE`, `PENDING_PAIRING`, `ARCHIVED`), unpairing berbasis konfirmasi `"ARCHIVE"`.
3. **InvitationsModule:** Mesin pairing atomik *double-secret* (kode 6 digit + token URL 64 karakter) dengan kedaluwarsa 72 jam.
4. **PlacesModule:** Direktori tempat terkurasi (OpenStreetMap adapter Jakarta), pencarian berbasis koordinat/kategori, penanganan konkurensi duplikasi tempat.
5. **WishlistModule:** Impian kencan bersama, prioritas (*Low, Medium, High*), estimasi biaya, status aktif/selesai.
6. **DatesModule:** Siklus hidup kencan (*Draft, Confirmed, Completed, Cancelled*), *multi-stop itinerary*, jadwal per jam, alokasi anggaran.
7. **VisitsModule & ReviewsModule:** Pencatatan kunjungan paska-kencan, serta sistem **Blind Reviews** (rating dan ulasan dirahasiakan sampai kedua pasangan selesai mengisi).
8. **ExpensesModule & OcrService:** Dompet kencan 50:50, kalkulasi saldo hutang otomatis (`balanceOwed`, `debtorUserId`, `creditorUserId`), audit trail pembatalan (*void reason*), dan OCR struk kasir multimodal vision.
9. **MediaModule:** Abstraksi `StoragePort` (Cloudinary signed uploads & adapter lokal) dengan verifikasi token server-side.
10. **MemoriesModule & AlbumsModule:** Kartu kenangan polaroid, foto ber-tag emosi, linimasa kronologis, serta kilas balik *On This Day*.
11. **CalendarModule:** Sinkronisasi jadwal kencan mendatang dan memori masa lalu.
12. **MemoryMapModule:** Agregasi pin geospasial kunjungan & kenangan dengan kalkulasi *bounding box* otomatis.
13. **LettersModule:** Surat cinta digital dengan isolasi draft milik penulis.
14. **TimeCapsulesModule:** Kapsul waktu terkunci sisi server (judul dan konten disensor hingga waktu buka tercapai).
15. **GoalsModule:** Target hubungan bersama dengan *milestone progress tracking* otomatis (0–100%).
16. **DecisionsModule:** Polling keputusan kencan dengan pencegahan voting ganda dan resolusi seri deterministik (*tie resolution*).
17. **GamesModule:** Refleksi harian **Daily Spark** dan kuis pasangan (*mutual blind reveal*).
18. **SurprisesModule:** Kejutan terjadwal dengan penutup pesan rahasia hingga tanggal pengungkapan.
19. **WrappedModule:** Kilas balik tahunan berdasarkan data riil kencan, tempat, dan biaya.
20. **AiModule:** Integrasi Google Gemini 3.8 Flash untuk pembuatan proposal rencana kencan cerdas.
21. **HealthModule:** Endpoint liveness probe (`/api/v1/health/live`) dan readiness probe (`/api/v1/health/ready`).

### 2.2 Lapisan Keamanan & Guards
- **`AuthGuard`:** Memverifikasi session bearer token atau cookie `ours_session`, mencocokkan hash SHA-256 ke tabel `sessions`, memperbarui sliding expiration jika telah lewat 15 menit.
- **`CoupleSpaceGuard`:** Memastikan pengguna memiliki relasi `CoupleMembership` berstatus `ACTIVE` untuk mengakses resource pasangan. Otomatis dilewati untuk endpoint beranotasi `@Public()`.
- **`EmailVerifiedGuard`:** Mengunci fitur kencan hingga alamat email diverifikasi.
- **`RateLimiterService`:** Melindungi endpoint sensitif (autentikasi dan AI) dengan algoritma sliding window memory.
- **`GlobalExceptionFilter`:** Menyensor stack trace dan error internal database di lingkungan produksi serta menyematkan `X-Correlation-ID`.

---

## 3. Arsitektur Frontend (Expo SDK 57 + React Native)

Aplikasi klien dibangun menggunakan **Expo SDK 57** dengan **Expo Router**, mendukung iOS, Android, dan Responsive Web tanpa perbedaan basis kode (*universal app*).

### 3.1 Peta Rute & Halaman (44 Rute Statis & Dinamis)
- **Grup Autentikasi (`apps/app/src/app/(auth)/`):**
  - `/login`: Masuk akun via email & sandi.
  - `/register`: Pendaftaran pengguna baru.
  - `/verify-email`: Verifikasi kode/token email.
  - `/forgot-password` & `/reset-password`: Pemulihan sandi.
- **Grup Pairing (`apps/app/src/app/(pairing)/`):**
  - `/create`: Membuat couple space baru dan menghasilkan kode pairing 6-karakter + tautan rahasia.
  - `/join`: Bergabung ke couple space pasangan menggunakan kode 6-karakter.
  - `/waiting`: Ruang tunggu interaktif hingga pasangan menerima undangan.
  - `/preview`: Pratinjau profil pasangan sebelum konfirmasi akhir.
  - `/archived`: Daftar arsip ruang kencan masa lalu (mode baca-saja).
  - `/settings`: Pengaturan space, tanggal jadian, mata uang, dan tombol unpair aman.
- **Grup Tab Utama Pasangan (`apps/app/src/app/(tabs)/`):**
  - `/(tabs)/index` (**Shared Home**): Kartu hitung mundur kencan, status kehadiran pasangan, refleksi Daily Spark, aksi cepat, dan pintasan AI.
  - `/(tabs)/explore` (**Explore Jakarta**): Pencarian tempat terkurasi, kategori kuliner/kafe/outdoor, filter harga, dan sakelar peta interaktif.
  - `/(tabs)/dates` (**Date Planner & Kalender**): Daftar rencana kencan aktif, timeline jadwal, dan tab kalender bersama.
  - `/(tabs)/visits` (**Kunjungan & Dompet 50:50**): Rekam jejak kencan yang telah dikunjungi, ulasan blind review, status saldo hutang-piutang, ringkasan bujet bulanan, dan tombol scan struk kasir.
  - `/(tabs)/hub` (**Hub Hubungan & Scrapbook**): Scrapbook polaroid kenangan, surat cinta, kapsul waktu, kuis chemistry, dan voting kencan.
- **Rute Detail & Alur Spesifik:**
  - `/receipts/scan`: Kamera live view scanner struk kasir bertenaga Gemini AI.
  - `/receipts/[id]`: Rincian struk kasir hasil scan (daftar menu makanan/minuman, pajak, servis, subtotal).
  - `/dates/planner`: Pembuat rencana kencan multi-stop dengan alokasi jam dan bujet.
  - `/places/[id]`: Detail tempat, foto, ulasan, koordinat geolokasi, dan tombol simpan ke wishlist.
  - `/explore/map`: Tampilan peta Jakarta dengan pin tempat yang pernah dikunjungi.
  - `/memories/index`: Linimasa album foto polaroid lengkap dengan rotasi sudut realistis.
  - `/time-capsule/index`: Kapsul waktu masa depan dengan gembok countdown.
  - `/quiz/index`: Kuis kencan dan permainan refleksi dua arah.
  - `/wishlist/index`: Daftar impian kencan dengan estimasi bujet.

### 3.2 Desain Visual & Antislop Standard
- **Palet Warna:** Accent Blue (`#3657D6`), Soft Blue (`#E6EBFA`), Surface White (`#FFFFFF`), Neutral Background (`#F8F9F7`), Dark Text (`#202522`), Sage (`#D8E8DA`), Peach (`#F4E4DA`), Gold (`#F5C85B`).
- **Tipografi:** UI Display: *Geist / Inter*. Editorial Accent: *Instrument Serif*.
- **Motion & 3D:** Menggunakan `React Native Reanimated` untuk transisi pegas alami, serta perspektif 3D halus pada kartu polaroid scrapbook (rotasi acak `-2°` s.d. `+1.5°`).

---

## 4. Arsitektur Database (PostgreSQL 16 + Prisma ORM)

Database menggunakan **PostgreSQL 16** yang dikelola via **Prisma ORM** dengan 21 model tabel yang terisolasi ketat.

```
+--------------------+        +---------------------+        +--------------------+
|       User         |<------>|  CoupleMembership   |<------>|    CoupleSpace     |
| (Akun Pengguna)    | 1    2 |  (Relasi Pasangan)  | 2    1 | (Ruang Privat 5050)|
+--------------------+        +---------------------+        +--------------------+
          |                                                            |
          |                                                            |
          v                                                            v
  [UserProfile]                                             [WishlistItem, DatePlan]
  [Session]                                                 [Visit, Review, Expense]
  [CoupleInvitation]                                        [Memory, Album, Calendar]
```

### 21 Model Data Prisma:
1. `User`: Identitas pengguna, email unik, hash Argon2id, token verifikasi email & reset sandi.
2. `UserProfile`: Nama tampilan (*display name*), foto profil, tanggal lahir, preferensi zona waktu.
3. `Session`: Token sesi login ter-hash SHA-256, user agent perangkat, alamat IP, timestamp sliding window.
4. `CoupleSpace`: Entitas sentral ruang bersama pasangan, tanggal anniversary, default mata uang (*IDR/USD*), status lifecycle (`ACTIVE`, `PENDING_PAIRING`, `ARCHIVED`).
5. `CoupleMembership`: Relasi keanggotaan (maksimal tepat 2 anggota aktif per space).
6. `CoupleInvitation`: Undangan pairing *double-secret* (kode 6 huruf + token URL 64 char) berbatas waktu 72 jam.
7. `Place`: Master data tempat (restoran, kafe, galeri, taman) dengan koordinat lintang/bujur dan provider OSM.
8. `SavedPlace`: Tempat yang disimpan ke wishlist atau daftar favorit pasangan.
9. `WishlistItem`: Impian kencan bersama berprioritas (*Low/Medium/High*) dengan estimasi bujet.
10. `DatePlan`: Rencana kencan lengkap dengan tanggal pelaksanaan, estimasi biaya, dan status (*Draft/Confirmed/Completed/Cancelled*).
11. `DatePlanStop`: Pemberhentian rencana kencan multi-stop dengan urutan urut, durasi menit, dan catatan kencan.
12. `Visit`: Catatan kencan yang telah terlaksana pada suatu tempat dengan tanggal kunjungan riil.
13. `Review`: Ulasan blind review (skor 1–5, catatan pribadi, status rahasia hingga mutual reveal).
14. `Expense`: Transaksi pengeluaran dompet bersama, nominal uang dalam unit integer minor (*rupiah/cents*), pembayar (`paidById`), dan alasan pembatalan jika di-void.
15. `MediaAsset`: File foto/media yang terunggah ke Cloudinary dengan URL aman dan ukuran file.
16. `Memory`: Kenangan kencan dengan catatan emosional, tag suasana hati, dan koordinat tempat.
17. `Album`: Koleksi pengelompokan kenangan kencan.
18. `CalendarEvent`: Jadwal kencan pada kalender bersama.
19. `AuditEvent`: Log riwayat perubahan kritis (unpairing, void expense, perubahan profil).
20. `TimeCapsule` & `LoveLetter`: Entitas memori relasional terlindungi.
21. `DecisionPoll` & `CoupleGoal`: Entitas keputusan dan target masa depan.

---

## 5. Mesin OCR Struk & Integrasi AI (Gemini 3.8 Flash)

Modul pengeluaran dan perencana kencan didukung oleh arsitektur AI hibrida dengan keandalan tinggi:

### 5.1 Pipeline Ekstraksi OCR Struk Kasir
```
[Unggah Foto Struk Kasir]
          │
          ▼
[Verifikasi Magic Numbers (JPEG/PNG/WebP)]
          │
          ├───► GEMINI MULTIMODAL AI VISION (Prioritas Utama)
          │     ├── Model: gemini-3.8-flash (Google Generative Language API)
          │     ├── Prompt Khusus Struk Kasir Restoran/Kafe Indonesia
          │     ├── Ekstraksi: Merchant, Tanggal, Item Makanan/Minuman, PB1/PPN, Service Charge, Total
          │     └── Redaksi API Key pada Log & Exception
          │
          └───► TESSERACT.JS v7 ENGINE (Fallback Otomatis Sisi Server)
                ├── Berjalan saat Gemini API offline / kuota habis / timeout 12s
                ├── Ekstraksi teks berbasis morfologi struk termal Indonesia
                └── Validasi Konsistensi Aritmetika (Item Sum + Pajak == Grand Total)
```

### 5.2 AI Date Architect (Gemini 3.8 Flash)
- **Model:** `gemini-3.8-flash` (Project Google Cloud `projects/491529373106`).
- **Proteksi Prompt Injection:** Parameter bujet dan kategori disanitasi ketat sebelum dimasukkan ke dalam prompt.
- **Bilateral Rate Limiting:** Maksimal 20 permintaan per jam per pasangan.
- **Fallback Deterministik:** Jika jaringan Google terganggu, sistem menghasilkan rencana kencan terstruktur berbasis aturan lokal tanpa menghentikan fungsionalitas aplikasi.

---

## 6. Alur Kerja Lengkap (End-to-End User Workflows)

### Workflow 1: Registrasi & Atomic Double-Secret Pairing
1. **Pendaftaran Akun:**
   - Partner A dan Partner B mendaftar akun terpisah di `/register` dengan email dan kata sandi. Sandi di-hash menggunakan Argon2id.
2. **Verifikasi Email:**
   - Token verifikasi dikirimkan ke email. Pengguna memverifikasi akun untuk membuka akses fitur pasangan.
3. **Pembuatan Ruang Pasangan (Partner A):**
   - Partner A membuka `/create`. Server membuat record `CoupleSpace` dengan status `PENDING_PAIRING` dan membuat `CoupleInvitation`.
   - Server menghasilkan **Kode Pairing 6-Karakter** (misal: `LOVE26`) dan **Tautan Rahasia 64-Karakter**.
   - Partner A masuk ke halaman *Waiting Room* (`/waiting`).
4. **Penerimaan Undangan (Partner B):**
   - Partner B memasukkan kode 6-karakter di `/join` atau mengeklik tautan rahasia.
   - Server menjalankan **transaksi database atomik**:
     - Memastikan status Partner B belum memiliki pasangan aktif (`ONE_ACTIVE_PER_USER`).
     - Memastikan kuota anggota space belum melebihi 2 orang.
     - Mengubah status space menjadi `ACTIVE`.
     - Mengaitkan kedua anggota ke tabel `CoupleMembership`.
5. **Aktivasi Bersama:**
   - Klien Partner A dan Partner B otomatis menyegarkan status dan diarahkan ke **Shared Home Screen** (`/(tabs)/index`).

---

### Workflow 2: Shared Home & Kehadiran Pasangan
1. **Header Pasangan:**
   - Menampilkan nama panggilan kedua pasangan, foto avatar, dan jumlah hari jadian berdasarkan `anniversaryDate`.
2. **Upcoming Date Countdown:**
   - Kartu hitung mundur menampilkan kencan terkonfirmasi terdekat (misal: *"3 Hari Lagi • Fine Dining di Plataran Menteng"*).
3. **Daily Spark Reflection:**
   - Menampilkan pertanyaan refleksi hari ini. Menampilkan status apakah pasangan telah menjawab tanpa membocorkan isinya sebelum kedua pihak selesai.

---

### Workflow 3: Eksplorasi Tempat (Places) & Wishlist Bersama
1. **Eksplorasi Kurasi Jakarta:**
   - Pasangan membuka tab `Explore`. Sistem menyajikan tempat kuliner, kafe, galeri seni, dan aktivitas luar ruangan di Jakarta (data OpenStreetMap).
2. **Pencarian & Filter:**
   - Filter berdasarkan kategori: *Kafe Santai, Makan Malam Romantis, Budaya & Seni, Hiburan, Outdoor*.
3. **Penyimpanan ke Wishlist:**
   - Pengguna menekan tombol hati *"Simpan ke Wishlist"* pada tempat pilihan (misal: *Ottera Cafe Senopati*).
   - Data tersimpan ke tabel `WishlistItem` dengan tingkat prioritas (*High Priority*) dan estimasi bujet.

---

### Workflow 4: Penyusunan Rencana Kencan (Date Planner)
1. **Buat Rencana Kencan Baru:**
   - Pengguna membuka tab `Dates` lalu menekan *"Rencanakan Kencan Baru"*.
2. **Multi-Stop Itinerary:**
   - Menentukan judul (misal: *"Kencan Akhir Pekan Senopati & SCBD"*), tanggal pelaksanaan, dan batas bujet.
   - Menambahkan pemberhentian berurutan:
     - Stop 1 (15:00): Ngopi di *Ottera Cafe* (durasi 90 menit).
     - Stop 2 (17:30): Berkeliling galeri seni di *Senopati Arts*.
     - Stop 3 (19:30): Makan malam di *Plataran Dharmawangsa*.
3. **Checklist Persiapan:**
   - Menambahkan daftar perlengkapan: *"Bawa kamera film, reservasi meja indoor, outfit bernuansa sage"*.
4. **Konfirmasi Pasangan:**
   - Rencana kencan tersinkronisasi ke perangkat pasangan dan otomatis muncul di kalender bersama (`CalendarEvent`).

---

### Workflow 5: AI Date Architect (Google Gemini 3.8 Flash)
1. **Input Preferensi Bahasa Alami:**
   - Pengguna menekan tombol AI di beranda dan mengetikkan: *"Ide kencan santai Sabtu sore di Jakarta Selatan, 2 tempat kopi dan galeri, bujet maksimal 400 ribu, suasana tenang"*.
2. **Pemrosesan Server-Side:**
   - Backend memanggil endpoint Google Generative Language API model `gemini-3.8-flash`.
   - Gemini merancang proposal terstruktur (judul, deskripsi romantis, perhentian terurut, durasi, dan checklist).
3. **Pratinjau Proposal:**
   - Klien Expo menampilkan kartu pratinjau rencana kencan AI.
4. **Adopsi Instan:**
   - Pengguna menekan *"Gunakan Rencana Ini"*. Seluruh perhentian langsung disalin ke Date Planner resmi.

---

### Workflow 6: Eksekusi Kencan, Visits & Mutual Blind Reviews
1. **Check-in Kencan Selesai:**
   - Saat kencan selesai, pengguna menandai rencana sebagai `COMPLETED` dan mencatat kunjungan (`Visit`).
2. **Pengisian Blind Review (Partner A):**
   - Partner A memberikan rating bintang (misal: 5/5) dan menulis kesan intim: *"Suasananya tenang sekali, matcha latte-nya enak"*.
   - **Invarian Server:** Ulasan Partner A disimpan dengan flag rahasia. Partner B **tidak dapat melihat ulasan Partner A** sama sekali.
3. **Pengisian Blind Review (Partner B):**
   - Partner B membuka halaman kencan dan menulis ulasannya: *"Suka banget tempat duduk di dekat jendelanya"*.
4. **Mutual Reveal:**
   - Saat Partner B mengirimkan ulasannya, server mendeteksi kedua pihak telah mengisi ulasan.
   - Status ulasan bertransisi ke `REVEALED`. Kartu ulasan di kedua ponsel terbuka secara bersamaan, menampilkan skor rata-rata kencan (*Couple Score*).

---

### Workflow 7: Dompet Bersama 50:50 & Scan Struk Otomatis (OCR)
1. **Buka Scanner Struk Kasir:**
   - Di tab `Visits` / `Expenses`, pengguna mengetuk *"Scan Struk Kasir"*.
   - Layar kamera live view (`/receipts/scan`) mendeteksi batas struk kasir.
2. **Ekstraksi AI Vision Multimodal:**
   - Foto dikirimkan ke `/api/v1/expenses/ocr`.
   - Gemini Vision AI membaca struk kasir yang buram/termal, mengekstrak:
     - Nama tempat: *Ottera Cafe Senopati*
     - Rincian item: *2x Iced Latte (Rp 90.000), 1x Truffle Fries (Rp 55.000)*
     - Biaya servis & Pajak PB1 10%: *Rp 14.500*
     - Total Akhir: *Rp 159.500*
3. **Penyimpanan Transaksi 50:50:**
   - Pengguna memverifikasi hasil scan dan memilih siapa yang membayar (misal: *"Daniel yang bayar"*).
   - Pengeluaran dicatat ke database.
4. **Kalkulasi Saldo Otomatis:**
   - Sistem secara otomatis menghitung:
     - Total pengeluaran bulan ini.
     - Porsi 50:50 (Rp 79.750 per orang).
     - Saldo hutang: *"Sasa berhutang Rp 79.750 kepada Daniel"*.
5. **Void Audit Trail:**
   - Jika transaksi dibatalkan, sistem mewajibkan alasan pembatalan tertulis yang dicatat permanen di `AuditEvent` untuk mencegah manipulasi sepihak.

---

### Workflow 8: Interactive Scrapbook, Album & On This Day
1. **Unggah Foto Kenangan:**
   - Pengguna mengunggah foto kencan ke tab `Hub` -> `Scrapbook`.
   - Foto dikirimkan ke Cloudinary via *signed token server-side*.
2. **Tata Letak Buku Kenangan (Scrapbook Layout):**
   - Foto ditampilkan dengan bingkai polaroid klasik, rotasi sudut acak `-2°` s.d. `+1.5°`, tanggal tulisan tangan, dan tag emosi (*Romantic, Adventurous, Cozy*).
3. **Fitur Kilas Balik On This Day:**
   - Jika terdapat kenangan pada tanggal yang sama di tahun-tahun sebelumnya, banner kilas balik muncul di beranda: *"1 Tahun Lalu Hari Ini: Kencan pertama kalian di Monas"*.

---

### Workflow 9: Surat Cinta Digital (Love Letters)
1. **Tulis Surat Cinta:**
   - Pengguna membuka modul `Letters` di Hub dan menulis surat pribadi untuk pasangan.
2. **Isolasi Draft:**
   - Selama berstatus `DRAFT`, surat disimpan di database namun **disaring sepenuhnya oleh query backend** sehingga pasangan tidak dapat membaca draft yang belum selesai.
3. **Kirim Surat (`SENT`):**
   - Saat penulis menekan *"Kirim Surat"*, status berubah menjadi `SENT` dan surat mendarat di kotak masuk pasangan dengan animasi amplop terbuka.

---

### Workflow 10: Kapsul Waktu Terkunci Sisi Server (Time Capsules)
1. **Kunci Pesan Masa Depan:**
   - Pasangan menyimpan pesan atau foto rahasia untuk dibuka pada momen spesial (misal: *Anniversary ke-2 pada 20 Oktober 2027*).
2. **Anti-Manipulasi Jam Lokal (Server-Side Gate):**
   - Server menyensor konten dan judul kapsul (`content: null`).
   - Memajukan jam pada perangkat ponsel **tidak akan membuka kapsul**, karena dekripsi dilakukan secara eksklusif oleh jam server saat `serverClock >= unlockAt`.

---

### Workflow 11: Target Hubungan (Couple Goals) & Polling Keputusan (Decisions)
1. **Target Bersama (Couple Goals):**
   - Pasangan membuat target (misal: *"Menabung Liburan ke Kyoto"*).
   - Menambahkan milestone: *Buat Paspor, Beli Tiket Promo, Booking Ryokan*.
   - Setiap milestone yang dicentang memperbarui persentase progress (0% -> 33% -> 66% -> 100%) dan otomatis bertransisi ke `ACHIEVED`.
2. **Polling Pengambilan Keputusan (Decisions):**
   - Buat polling: *"Makan malam di mana Jumat ini?"* dengan opsi: *Sushi Tei, Osteria Gia, Padang Merdeka*.
   - Masing-masing pasangan memberikan satu suara rahasia.
   - **Resolusi Seri Deterministik:** Jika terjadi seri (1 vs 1), sistem mendeteksi seri dan mengembalikan `winnerOptionIndex = undefined` alih-alih memilih opsi pertama secara tidak adil.

---

### Workflow 12: Permainan Pasangan (Games) & Refleksi Harian (Daily Spark)
1. **Pertanyaan Refleksi Daily Spark:**
   - Berganti otomatis setiap hari berdasarkan hari dalam setahun (Day of Year).
   - Partner A menjawab: *"Hal kecil yang bikin kamu tersenyum kemarin?"*.
   - Jawaban Partner A dirahasiakan (`partnerAnswer: null`) hingga Partner B selesai menjawab.
   - Begitu kedua pihak menjawab, kunci terbuka (*Mutual Reveal*) dan kedua jawaban ditampilkan berdampingan.
2. **Kuis Chemistry Pasangan:**
   - Kuis pilihan ganda untuk menguji seberapa dalam pasangan saling mengenal.
   - Skor kecocokan persentase dihitung secara otomatis setelah keduanya menyelesaikan kuis.

---

### Workflow 13: OURS Wrapped (Kilas Balik Tahunan)
1. **Agregasi Data Riil Hubungan:**
   - Pada akhir tahun, backend mengagregasi data aktual:
     - Jumlah kencan yang terlaksana.
     - Total tempat baru yang dikunjungi.
     - Kategori kencan terfavorit.
     - Rata-rata skor kebahagiaan kencan (*Couple Score Average*).
     - Total pengeluaran bersama yang tercatat.
2. **Penyajian Cerita:**
   - Ditampilkan dalam format cerita interaktif (*story format*) yang siap diabadikan atau dibagikan.

---

### Workflow 14: Archive-First Unpairing (Pemisahan Aman)
1. **Permintaan Pemisahan (Unpair):**
   - Pengguna membuka menu *Pengaturan Ruang Pasangan*.
2. **Konfirmasi Wajib Kata Kunci:**
   - Pengguna diwajibkan mengetikkan kata sandi konfirmasi tepat: `"ARCHIVE"`.
3. **Status Read-Only (Non-Destruktif):**
   - Space diubah menjadi status `ARCHIVED`. Seluruh kenangan, foto, dan riwayat transaksi **tidak dihapus secara destruktif**, melainkan dikunci dalam mode arsip baca-saja.
4. **Kelayakan Re-pairing Instan:**
   - Kedua pengguna kembali berstatus lajang di aplikasi dan bebas membuat space baru atau bergabung dengan pasangan baru tanpa konflik database.

---

## 7. Keamanan, Privasi & Invarian Domain

| Area | Invarian Rekayasa & Aturan Keamanan |
| :--- | :--- |
| **Isolasi Pasangan** | Data terisolasi multi-tenant via `CoupleSpaceGuard`. Pengguna di luar space dilarang keras membaca data pasangan lain. |
| **Batas Keanggotaan** | Maksimal tepat 2 anggota aktif per couple space. 1 pengguna hanya boleh memiliki 1 keanggotaan aktif. |
| **Integritas Uang** | Semua nominal uang disimpan dalam unit minor integer (*IDR penuh / cents*) tanpa pecahan desimal mengambang (*no float precision bugs*). |
| **Blind Reviews** | Rating dan teks ulasan di-masking oleh server hingga kedua pasangan selesai mengisi. |
| **Privasi Draft** | Draft surat cinta milik penulis tidak pernah dikirimkan ke pasangan sebelum status resmi `SENT`. |
| **Kapsul Waktu** | Enkripsi dan penyensoran konten di sisi server; kebal manipulasi jam lokal perangkat. |
| **Keamanan Kunci AI** | Kunci Google Gemini API tersimpan 100% di environment server NestJS; disensor dari semua log dan respons kesalahan. |
| **Anti-Prompt Injection** | Seluruh masukan teks pengguna disanitasi sebelum diinjeksikan ke prompt Gemini AI. |

---

## 8. Panduan Menjalankan & Memverifikasi Proyek

### 8.1 Menjalankan Backend NestJS
```bash
# Dari root monorepo
pnpm --filter @ours/api start:dev
```
- Server aktif di: `http://localhost:3000`
- Liveness Probe: `http://localhost:3000/api/v1/health/live`
- Readiness Probe: `http://localhost:3000/api/v1/health/ready`

### 8.2 Menjalankan Frontend Expo
```bash
# Menjalankan Expo Web / Dev Client
pnpm --filter @ours/app start

# Membuka langsung di browser
pnpm --filter @ours/app web

# Menjalankan ekspor bundling web
npx expo export --platform web
```

### 8.3 Menjalankan Pengujian Lengkap
```bash
# 1. Menjalankan seluruh pengujian unit & integrasi API (24 test suites)
pnpm --filter @ours/api test

# 2. Menjalankan type-check TypeScript di 8 paket monorepo
pnpm turbo run type-check

# 3. Menjalankan kompilasi build produksi monorepo
pnpm turbo run build
```

---

## 9. Pipeline Penyimpanan Foto & Sinkronisasi Dua Pasangan

### 9.1 Alur Unggah & Penyimpanan Media (`/media/direct-upload` & `/memories`)
1. **Pemilihan/Pemotretan Foto di Frontend:**
   - Pengguna mengambil foto dari kamera atau memilih dari galeri via `expo-image-picker` dengan opsi `base64: true`.
   - Foto dikonversi ke Base64 Data URL permanen (`data:image/jpeg;base64,...`) sehingga kebal kedaluwarsa URL sementara browser (`blob:` URI).
2. **Unggah Aman ke Media Storage:**
   - Frontend memanggil endpoint `POST /api/v1/media/direct-upload`.
   - Backend memvalidasi keanggotaan aktif ruang pasangan (`CoupleSpaceGuard`).
   - Backend menghasilkan `storageKey` unik yang terikat pada `coupleSpaceId` (`media/${spaceId}/${timestamp}_${uuid}_${filename}`), mencegah *PostgreSQL B-tree index row size limit error* (maks 2.704 byte).
   - URL foto disimpan di `metadata.dataUrl` (atau Cloudinary secure URL jika cloud storage dikonfigurasi).
   - Catatan `MediaAsset` aktif dibuat di database PostgreSQL dengan relasi ke couple space dan uploader.
3. **Penyimpanan Momen Bersama di Database:**
   - Frontend memanggil `POST /api/v1/memories` menyertakan `mediaAssetIds: [uploadedAsset.id]`.
   - Backend membuat entri `Memory` dan menghubungkannya ke `MemoryMedia` secara transaksional.
4. **Sinkronisasi Otomatis Antar Pasangan:**
   - `CoupleDataProvider` menjalankan `refreshMemories()` yang memanggil `GET /api/v1/memories` saat aplikasi dibuka atau di-refresh (pull-to-refresh).
   - Kedua pasangan (`Partner A` dan `Partner B`) melihat galeri momen yang sama persis secara real-time dari sumber data tunggal (*Single Source of Truth*) di PostgreSQL.

---

## 10. Alur Autentikasi Baru & Tautan Otomatis Pasangan (Seamless Pairing)

### 10.1 Registrasi Tanpa Kegagalan Validasi
- **Nama Panggilan Fleksibel:** Jika pengguna tidak mengisi nama panggilan pada saat pendaftaran, sistem otomatis memberikan nama panggilan default berbasis email atau `'Partner'`, mencegah kegagalan validasi `@IsNotEmpty()` pada `RegisterDto`.
- **Auto-Verifikasi Cerdas:** Pada mode pengembangan atau saat menggunakan `MockEmailAdapter` (tanpa live SMTP pihak ketiga), akun baru otomatis terverifikasi (`emailVerified: true`) saat pendaftaran sehingga pengguna tidak tersangkut di layar verifikasi email.

### 10.2 Tautan Kode Pasangan Langsung (Seamless Auto-Join)
- Jika Pasangan B mendaftar melalui tautan undangan atau memasukkan kode di layar awal onboarding (`?code=XXXXXX`), fungsi registrasi di `auth-context.tsx` secara otomatis memanggil `api.spaces.joinByCode({ pairingCode: code })` tepat setelah login berhasil.
- Ruang pasangan langsung beralih dari status `PENDING` menjadi `ACTIVE`, dan kedua pasangan langsung diarahkan ke layar beranda bersama (`/(tabs)`).

---
*Dokumentasi ini disusun secara komprehensif untuk memetakan arsitektur utuh, integrasi AI mutakhir, serta alur pengalaman pengguna pada aplikasi OURS.*
