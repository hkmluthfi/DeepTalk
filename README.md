# DeepTalk

> Setiap percakapan yang bermakna dimulai dari satu pertanyaan.

Website kartu pertanyaan Deep Talk yang elegan dan minimalis, dibangun dengan HTML, CSS, dan JavaScript murni.

## Cara Menjalankan

1. Buka folder `C:\College\Deeptalk Web`
2. Klik dua kali pada file `index.html`
3. Website akan terbuka di browser default kamu

Tidak diperlukan server, instalasi, atau koneksi internet (kecuali untuk font Google Fonts).

---

## Struktur Project

```
Deeptalk Web/
├── index.html          # Halaman utama
├── style.css           # Seluruh styling
├── script.js           # Logika aplikasi
├── README.md           # Dokumentasi ini
└── data/
    └── questions.js    # Bank pertanyaan (220+ pertanyaan)
```

---

## Fitur

| Fitur | Status |
|---|---|
| Random Question (tidak mengulang per sesi) | ✅ |
| Animasi Flip 3D | ✅ |
| Badge Kategori | ✅ |
| Badge Tingkat Kedalaman | ✅ |
| Progress Counter | ✅ |
| Responsive (Desktop, Tablet, Mobile) | ✅ |
| Pesan Selesai Sesi | ✅ |
| Reset / Mulai Sesi Baru | ✅ |

---

## Kategori Pertanyaan

| Kategori | Jumlah |
|---|---|
| Ice Breaker | 22 |
| Refleksi Diri | 22 |
| Pertemanan | 22 |
| Pasangan | 22 |
| Keluarga | 22 |
| Mimpi & Tujuan | 22 |
| Masa Kecil | 22 |
| Nilai Hidup | 22 |
| Filosofi | 22 |
| Mendalam | 22 |
| **Total** | **220** |

---

## Tingkat Kedalaman

- 🟢 **Ringan** — Pertanyaan ringan dan santai
- 🟡 **Sedang** — Pertanyaan yang membutuhkan refleksi ringan
- 🟠 **Dalam** — Pertanyaan yang mengajak berpikir mendalam
- 🔴 **Sangat Dalam** — Pertanyaan yang menyentuh inti diri

---

## Cara Menambah / Mengganti Pertanyaan

Edit file `data/questions.js`. Setiap pertanyaan mengikuti format:

```js
{
  category: "Refleksi Diri",   // Nama kategori
  depth: "Sedang",              // "Ringan" | "Sedang" | "Dalam" | "Sangat Dalam"
  question: "Teks pertanyaanmu di sini?"
}
```

---

## Rencana Pengembangan

Struktur kode sudah disiapkan untuk fitur-fitur berikut:

- [ ] Daily Question
- [ ] Favorite Question
- [ ] Dark Mode
- [ ] Reflection Journal
- [ ] AI Follow-up Question
- [ ] Share Question
- [ ] Multiple Deck
- [ ] Search by Category

---

## Teknologi

- **HTML5** — Struktur semantik
- **CSS3** — Vanilla CSS dengan CSS Custom Properties
- **JavaScript (ES6+)** — Modular, tanpa framework
- **Google Fonts** — Poppins
