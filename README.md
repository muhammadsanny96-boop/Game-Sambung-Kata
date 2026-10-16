# SAMBUNGIN! — Party Word Chain Game

Game party sambung kata seru berbahasa Indonesia dan Inggris yang kini mendukung **dua cara bermain**:
1. 📱 **1 Perangkat (Pass & Play)**: Dimainkan bergantian pada satu HP / laptop.
2. 📶 **Multi-Device (HP Masing-Masing)**: Bermain bersama lewat jaringan WebRTC P2P cukup dengan memasukkan **Kode Room 4 Huruf**!

---

## 🎯 Cara Bermain di HP Masing-Masing (Multi-Device)

1. **Untuk Pemain Pertama (Host)**:
   - Di menu utama, klik tombol ungu: **"MAIN DI HP MASING-MASING"**.
   - Pilih **"Buat Room Baru (Host)"**.
   - Masukkan nama Anda, lalu Room akan otomatis dibuat dengan **Kode 4 Karakter** (misalnya: `A7K9`).
   - Bagikan Kode Room tersebut kepada teman-teman Anda.
   - Setelah teman Anda bergabung ke dalam Lobby, Host dapat memilih Mode, Durasi Timer, dan Tingkat Tantangan, lalu klik **"MULAI PERMAINAN SEKARANG"**.

2. **Untuk Teman-Teman yang Bergabung (Client / Join)**:
   - Buka browser di HP masing-masing dan akses alamat game:
     - Jika berada di Wi-Fi yang sama dengan Host: `http://<IP-Host>:8000/index.html`
   - Klik **"MAIN DI HP MASING-MASING"** ➔ **"Gabung Room Teman (Join)"**.
   - Masukkan nama Anda dan **Kode Room** dari Host.
   - Klik **"GABUNG ROOM"**.
   - Anda akan masuk ke ruang tunggu (Lobby) hingga Host memulai permainan.

3. **Saat Permainan Berlangsung**:
   - **Saat giliran Anda**: Layar HP Anda akan menyala dengan notifikasi *"GILIRAN KAMU SEKARANG!"*, tombol Mulai Giliran, kolom input kata aktif, dan keyboard HP otomatis terbuka.
   - **Saat giliran lawan**: Layar HP Anda menampilkan status *"Menunggu giliran [Nama Teman]..."*, sementara timer hitung mundur, kata sebelumnya, huruf wajib, dan riwayat rantai kata tersinkronisasi secara real-time di semua HP!
   - Efek suara (*chime* benar, getar, dengung salah, dan selebrasi konfeti juara) berbunyi di semua perangkat!

---

## 📱 Mode 1 Perangkat (Pass & Play)

Tetap tersedia kapan saja bagi yang ingin nongkrong santai berbagi satu HP:
- Pilih **"1 PERANGKAT (PASS & PLAY)"**.
- Atur daftar nama pemain.
- Layar **Turn Handoff** akan menahan timer agar waktu **TIDAK BERJALAN** sebelum HP dioper ke teman dan tombol **"MULAI GILIRAN SEKARANG"** ditekan.

---

## 📚 Kamus Kosakata Super Luas
- **392.181 Kata** (40.000+ Bahasa Indonesia & 350.000+ Bahasa Inggris).
- Kategori tematik: *Hewan*, *Makanan*, *Tempat*, *Benda*, *Profesi*.
- Pencarian $\mathcal{O}(1)$ instan tanpa lag.

---

## 🚀 Cara Menjalankan Server Lokal

```bash
# Di direktori d:\games:
python -m http.server 8000
```

- Buka di komputer Host: `http://localhost:8000/index.html`
- Buka di HP teman (Wi-Fi lokal): `http://192.168.100.134:8000/index.html`
