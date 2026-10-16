# Rencana Pengujian SAMBUNGIN! (Test Plan)

Dokumen ini merinci cakupan pengujian fungsional, non-fungsional, dan penanganan kasus ekstrem (edge-case) untuk game party sambung kata **SAMBUNGIN!**.

---

## 1. Lingkup Pengujian Fungsional

### 1.1 Modul Normalisasi & Validasi Kata (`word-validator.js`)
- [ ] **Normalisasi string**: Mengabaikan spasi awal/akhir, huruf kapital, tanda baca, dan angka.
- [ ] **Aturan huruf sambung**: Huruf awal kata input harus tepat sama dengan huruf terakhir kata sebelumnya.
- [ ] **Pencegahan kata duplikat**: Kata yang sama tidak boleh dipakai berulang kali dalam sesi ronde yang sama.
- [ ] **Kamus kosakata lokal**: Kata yang tidak ada di dataset lokal (`words.json`) ditolak dengan pesan yang jelas.
- [ ] **Panjang kata minimum**: Kata harus minimal 2 karakter.
- [ ] **Validasi tantangan aktif**:
  - Tantangan Kategori Wajib (harus sesuai kategori kamus).
  - Tantangan Larangan Huruf (kata tidak boleh mengandung huruf terlarang).
  - Tantangan Kata Panjang (kata harus memenuhi panjang minimal misalnya 6 huruf).

### 1.2 State Mesin & Siklus Timer (`game-engine.js`)
- [ ] **Siklus State**: `IDLE` ➔ `SETUP` ➔ `READY` (Handoff) ➔ `PLAYING` ➔ `PAUSED` ➔ `GAME_OVER`.
- [ ] **Turn Handoff (Fitur Khusus)**:
  - Saat giliran berganti, timer **TIDAK** berjalan otomatis.
  - Tampil layar konfirmasi *"Giliran [Pemain]! Tekan 'Mulai Giliran' saat siap"*.
  - Timer hanya mulai berjalan setelah tombol konfirmasi ditekan.
- [ ] **Pencegahan Race Condition**:
  - Tombol submit yang ditekan bersamaan dengan timeout hanya diproses satu kali (flag `isProcessingTurn`).
  - Timer ganda tidak boleh terbentuk saat pause/resume berulang.
- [ ] **Rotasi Giliran Pass-and-Play**:
  - Giliran berputar hanya ke pemain dengan status `ACTIVE`.
  - Pemain dengan status `ELIMINATED` dilewati secara otomatis.

### 1.3 Mode Permainan & Kondisi Selesai
- [ ] **Last Player Standing**:
  - Pengurangan 1 nyawa saat salah/timeout.
  - Eliminasi saat nyawa = 0.
  - Game over & pengumuman pemenang saat hanya tersisa 1 pemain aktif.
- [ ] **Free Play**:
  - Tidak ada eliminasi pemain.
  - Akumulasi skor berdasarkan panjang kata & bonus tantangan.
- [ ] **Sudden Death**:
  - 1 nyawa, 1 kegagalan langsung eliminasi.

### 1.4 Setup Pemain & Aksesibilitas UI
- [ ] Validasi minimal 2 pemain sebelum tombol mulai aktif.
- [ ] Tambah nama baru, edit nama, dan hapus nama (dengan proteksi minimal 2 pemain).
- [ ] Pencegahan nama kosong dan nama duplikat.
- [ ] Dukungan responsif layar mobile (touch target besar) hingga desktop.
- [ ] Efek suara Web Audio API (dapat dinyalakan/dimatikan di Pengaturan).

---

## 2. Rencana Otomasi Pengujian

Skrip otomasi Node.js (`tests/test-runner.js`) disiapkan untuk menguji logika inti secara terisolasi tanpa memerlukan browser atau internet.
Pengujian interaktif visual dijalankan melalui browser.
