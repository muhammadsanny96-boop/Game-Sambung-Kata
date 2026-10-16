# SAMBUNGIN! — Party Word Chain Game

Game party sambung kata seru berbahasa Indonesia yang dirancang untuk dimainkan bersama oleh beberapa orang secara bergantian pada **satu perangkat** (*pass-and-play local multiplayer*).

---

## 🎯 Aturan Permainan

1. **Sambung Kata**: Kata yang kamu ketik harus diawali huruf terakhir dari kata sebelumnya.
   - Contoh: BUK**U** ➔ **U**LA**R** ➔ **R**OT**I** ➔ **I**KA**N**.
2. **Pergantian Giliran Terjaga (Turn Handoff)**:
   - Saat giliran berpindah ke pemain lain, layar konfirmasi akan tampil dan timer **TIDAK** akan berjalan.
   - Oper perangkat ke temanmu. Waktu baru mulai berjalan setelah tombol **"MULAI GILIRAN SEKARANG"** ditekan!
3. **Kamus Kosakata Lokal**: Kata divalidasi terhadap dataset kosakata lokal.
4. **Anti-Duplikat**: Kata yang telah digunakan dalam sesi yang sama tidak dapat dipakai ulang.
5. **Mode Permainan**:
   - **Last Player Standing**: Setiap pemain dibekali 3 nyawa. Salah atau waktu habis mengurangi 1 nyawa. Pemain terakhir yang bertahan menang!
   - **Free Play**: Tanpa eliminasi. Kumpulkan poin kata sebanyak-banyaknya.
   - **Sudden Death**: Ketegangan tinggi dengan 1 nyawa per pemain. Sekali salah langsung gugur!
6. **Sistem Tantangan**: Modifier acak seperti *Kategori Wajib*, *Waktu Kilat*, *Larangan Huruf Tertentu*, *Kata Panjang*, dan *Bonus Poin*.

---

## 🚀 Cara Menjalankan

Game ini dibuat dengan **HTML5, CSS3 murni, dan Vanilla JavaScript (Modular ES6)**, 100% tanpa dependensi framework atau backend, dan dapat berjalan secara offline.

### Pilihan 1: Buka dengan Live Server / Python HTTP Server (Disarankan untuk modul ES6)
Karena menggunakan modul ES6 (`type="module"`), buka direktori `sambungin-game/` melalui static server lokal:

```bash
# Menggunakan Python 3:
cd sambungin-game
python -m http.server 8000
```
Buka browser dan akses: `http://localhost:8000`

### Pilihan 2: Menggunakan Node `npx serve`
```bash
cd sambungin-game
npx -y serve .
```

---

## 📁 Struktur Proyek

```text
sambungin-game/
├── index.html               # Struktur antarmuka semantic HTML5
├── css/
│   └── style.css            # Desain mobile-first, palet Deep Indigo & Amber Yellow
├── js/
│   ├── app.js               # Kontroler UI, routing layar, event handler
│   ├── game-engine.js       # Mesin logika permainan, giliran, timer single-lifecycle
│   ├── word-validator.js    # Modul validasi kata & aturan rantai huruf
│   ├── challenges.js        # 8 mekanik tantangan acak
│   └── audio.js             # Efek suara Web Audio API tanpa file eksternal
├── data/
│   └── words.json           # Kamus kosakata bahasa Indonesia lokal
├── tests/
│   ├── test-plan.md         # Rencana pengujian dan kriteria penerimaan
│   └── test-runner.js       # Skrip pengujian otomatis unit logika
└── README.md                # Dokumentasi proyek
```
