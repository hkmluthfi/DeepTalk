/**
 * DeepTalk — script.js
 *
 * Arsitektur fungsional yang bersih dan mudah dikembangkan.
 * Setiap fungsi memiliki satu tanggung jawab yang jelas.
 *
 * ── State Management ──────────────────────────────────
 *   state          : Objek terpusat yang menyimpan seluruh state aplikasi
 *
 * ── Core Functions ────────────────────────────────────
 *   init()                 : Inisialisasi aplikasi saat DOM siap
 *   getRandomQuestion()    : Ambil pertanyaan acak dari daftar yang tersisa
 *   loadQuestion()         : Muat pertanyaan ke kartu (koordinator utama)
 *   flipCard()             : Jalankan animasi flip 3D
 *   displayQuestion()      : Tampilkan data pertanyaan ke DOM
 *   updateProgress()       : Perbarui teks progress counter
 *   updateButtons()        : Atur tampilan tombol sesuai kondisi
 *   showPage()             : Navigasi antar halaman (landing / main)
 *   resetSession()         : Mulai sesi baru
 *   handleSessionComplete(): Tampilkan pesan ketika semua pertanyaan habis
 *
 * ── Extensibility Hooks ───────────────────────────────
 *   Komentar [FUTURE] menandai titik integrasi fitur mendatang seperti:
 *   Daily Question, Favorite, Dark Mode, Journal, AI, Share, Search, Deck
 */

'use strict';

/* ═══════════════════════════════════════════════════════════
   1. STATE — Satu sumber kebenaran untuk seluruh aplikasi
═══════════════════════════════════════════════════════════ */

/**
 * @typedef {Object} Question
 * @property {string} category - Nama kategori pertanyaan
 * @property {string} depth    - Tingkat kedalaman: "Ringan" | "Sedang" | "Dalam" | "Sangat Dalam"
 * @property {string} question - Teks pertanyaan
 */

const state = {
  /** Seluruh daftar pertanyaan dari questions.js */
  allQuestions: [],

  /** Pertanyaan yang belum muncul di sesi ini */
  remainingQuestions: [],

  /** Pertanyaan yang sedang ditampilkan */
  currentQuestion: null,

  /** Jumlah kartu yang sudah dibuka dalam sesi ini */
  cardCount: 0,

  /** Apakah kartu sedang dalam kondisi terbalik (menampilkan pertanyaan) */
  isFlipped: false,

  /** Apakah animasi sedang berjalan (untuk mencegah klik ganda) */
  isAnimating: false,

  /** Apakah sesi sudah selesai (semua pertanyaan habis) */
  isSessionComplete: false,

  // [FUTURE] dailyQuestion: null,
  // [FUTURE] favorites: [],
  // [FUTURE] journal: [],
  // [FUTURE] isDarkMode: false,
  // [FUTURE] activeDeck: 'default',
  // [FUTURE] activeCategory: null,
};


/* ═══════════════════════════════════════════════════════════
   2. DOM REFERENCES — Referensi elemen HTML
═══════════════════════════════════════════════════════════ */
const dom = {
  // Halaman
  landingPage:    () => document.getElementById('landing-page'),
  mainPage:       () => document.getElementById('main-page'),

  // Landing
  btnMulai:       () => document.getElementById('btn-mulai'),

  // Progress
  progressText:   () => document.getElementById('progress-text'),

  // Card
  cardFlipper:    () => document.getElementById('card-flipper'),
  cardBack:       () => document.getElementById('card-back'),
  cardQuestion:   () => document.getElementById('card-question'),
  badgeCategory:  () => document.getElementById('badge-category'),
  badgeDepth:     () => document.getElementById('badge-depth'),

  // Tombol
  btnAmbil:       () => document.getElementById('btn-ambil'),
  btnBerikutnya:  () => document.getElementById('btn-berikutnya'),
  btnReset:       () => document.getElementById('btn-reset'),
};


/* ═══════════════════════════════════════════════════════════
   3. INITIALIZATION
═══════════════════════════════════════════════════════════ */

/**
 * Inisialisasi seluruh aplikasi.
 * Dipanggil saat DOM selesai dimuat.
 */
function init() {
  // Pastikan bank pertanyaan sudah dimuat dari questions.js
  if (typeof questions === 'undefined' || !Array.isArray(questions)) {
    console.error('DeepTalk: Bank pertanyaan tidak ditemukan. Pastikan data/questions.js dimuat.');
    return;
  }

  // Simpan ke state
  state.allQuestions = questions;

  // Daftarkan semua event listener
  registerEventListeners();

  console.log(`DeepTalk siap. Total pertanyaan: ${state.allQuestions.length}`);
}

/**
 * Daftarkan semua event listener pada tombol-tombol.
 */
function registerEventListeners() {
  // Landing: tombol Mulai
  dom.btnMulai().addEventListener('click', () => {
    showPage('main');
    initSession();
  });

  // Main: tombol Ambil Kartu (saat kartu masih tertutup)
  dom.btnAmbil().addEventListener('click', () => {
    if (state.isAnimating) return;
    loadQuestion();
  });

  // Main: tombol Pertanyaan Berikutnya (saat kartu sudah terbuka)
  dom.btnBerikutnya().addEventListener('click', () => {
    if (state.isAnimating) return;
    loadQuestion();
  });

  // Main: tombol Reset / Mulai Sesi Baru
  dom.btnReset().addEventListener('click', () => {
    resetSession();
  });
}


/* ═══════════════════════════════════════════════════════════
   4. SESSION MANAGEMENT
═══════════════════════════════════════════════════════════ */

/**
 * Inisialisasi sesi baru.
 * Mengacak seluruh daftar pertanyaan dan mengatur ulang state.
 */
function initSession() {
  state.remainingQuestions = shuffleArray([...state.allQuestions]);
  state.currentQuestion    = null;
  state.cardCount          = 0;
  state.isFlipped          = false;
  state.isAnimating        = false;
  state.isSessionComplete  = false;

  // Pastikan kartu kembali ke posisi depan
  dom.cardFlipper().classList.remove('flipped');
  dom.cardBack().classList.remove('session-complete');

  updateProgress();
  updateButtons('initial');
}

/**
 * Reset sesi: mulai ulang dari nol.
 */
function resetSession() {
  initSession();
}


/* ═══════════════════════════════════════════════════════════
   5. CORE — Logika utama pertanyaan
═══════════════════════════════════════════════════════════ */

/**
 * Ambil satu pertanyaan secara acak dari sisa pertanyaan di sesi ini.
 * Menghapus pertanyaan tersebut dari daftar agar tidak muncul dua kali.
 *
 * @returns {Question|null} Pertanyaan yang dipilih, atau null jika habis
 */
function getRandomQuestion() {
  if (state.remainingQuestions.length === 0) {
    return null;
  }

  // Ambil pertanyaan pertama dari daftar yang sudah diacak
  const question = state.remainingQuestions.shift();
  return question;
}

/**
 * Koordinator utama: ambil pertanyaan baru dan tampilkan dengan animasi.
 * Dipanggil oleh tombol "Ambil Kartu" dan "Pertanyaan Berikutnya".
 */
function loadQuestion() {
  const question = getRandomQuestion();

  if (!question) {
    // Tidak ada pertanyaan tersisa
    handleSessionComplete();
    return;
  }

  state.currentQuestion = question;
  state.cardCount++;

  updateProgress();
  updateButtons('loading');

  // Jika kartu belum pernah di-flip, lakukan flip pertama kali
  if (!state.isFlipped) {
    flipCard(() => {
      displayQuestion(question);
      updateButtons('showing');
    });
    return;
  }

  // Jika kartu sudah terbalik: balik kembali → tampilkan → balik lagi
  reflipCard(() => {
    displayQuestion(question);
    updateButtons('showing');
  });
}

/**
 * Tampilkan data pertanyaan ke elemen DOM kartu.
 *
 * @param {Question} question - Objek pertanyaan yang akan ditampilkan
 */
function displayQuestion(question) {
  const elQuestion  = dom.cardQuestion();
  const elCategory  = dom.badgeCategory();
  const elDepth     = dom.badgeDepth();

  // Teks pertanyaan dengan animasi masuk
  elQuestion.textContent = question.question;
  elQuestion.classList.remove('animate-in');

  // Trigger reflow agar animasi bisa diulang
  void elQuestion.offsetWidth;
  elQuestion.classList.add('animate-in');

  // Badge kategori
  elCategory.textContent = question.category;

  // Badge tingkat kedalaman
  elDepth.textContent = question.depth;
  elDepth.setAttribute('data-depth', question.depth);

  // [FUTURE] Tambahkan tombol Favorit di sini
  // [FUTURE] Tambahkan tombol Share di sini
  // [FUTURE] Panggil AI Follow-up di sini
}

/**
 * Update teks progress counter.
 * Contoh: "Pertanyaan 3 dari 10" atau "Siap membuka kartu pertama"
 */
function updateProgress() {
  const el = dom.progressText();

  if (state.cardCount === 0) {
    el.textContent = 'Siap membuka kartu pertama';
    return;
  }

  const total = state.allQuestions.length;
  el.textContent = `Pertanyaan ${state.cardCount} dari ${total}`;

  // [FUTURE] Tambahkan progress bar visual di sini
}

/**
 * Atur visibilitas tombol sesuai kondisi aplikasi.
 *
 * @param {'initial'|'loading'|'showing'|'complete'} situation - Kondisi saat ini
 */
function updateButtons(situation) {
  const btnAmbil      = dom.btnAmbil();
  const btnBerikutnya = dom.btnBerikutnya();
  const btnReset      = dom.btnReset();

  switch (situation) {
    case 'initial':
      // Belum ada kartu dibuka
      btnAmbil.classList.remove('hidden');
      btnBerikutnya.classList.add('hidden');
      btnReset.classList.add('hidden');
      btnAmbil.disabled = false;
      break;

    case 'loading':
      // Animasi sedang berjalan
      btnAmbil.disabled = true;
      btnBerikutnya.disabled = true;
      break;

    case 'showing':
      // Pertanyaan sedang ditampilkan
      btnAmbil.classList.add('hidden');
      btnBerikutnya.classList.remove('hidden');
      btnReset.classList.remove('hidden');
      btnBerikutnya.disabled = false;
      btnReset.disabled = false;
      break;

    case 'complete':
      // Semua pertanyaan habis
      btnAmbil.classList.add('hidden');
      btnBerikutnya.classList.add('hidden');
      btnReset.classList.remove('hidden');
      btnReset.disabled = false;
      break;
  }
}


/* ═══════════════════════════════════════════════════════════
   6. ANIMATION — Animasi flip kartu
═══════════════════════════════════════════════════════════ */

/** Durasi animasi flip dalam milidetik (harus sinkron dengan CSS) */
const FLIP_DURATION_MS = 500;

/**
 * Flip kartu dari sisi depan ke belakang (pertama kali).
 *
 * @param {Function} onHalfway - Callback dipanggil di tengah animasi
 */
function flipCard(onHalfway) {
  state.isAnimating = true;

  // Setengah jalan: konten sudah tidak terlihat, isi dulu
  const halfTime = FLIP_DURATION_MS / 2;

  setTimeout(() => {
    if (typeof onHalfway === 'function') {
      onHalfway();
    }
  }, halfTime);

  // Mulai animasi flip
  dom.cardFlipper().classList.add('flipped');
  state.isFlipped = true;

  // Selesai animasi
  setTimeout(() => {
    state.isAnimating = false;
  }, FLIP_DURATION_MS);
}

/**
 * Re-flip: balik kembali ke depan, isi pertanyaan baru, lalu balik ke belakang.
 * Memberikan efek "kartu dibalik, diganti, dibalik lagi".
 *
 * @param {Function} onComplete - Callback setelah animasi selesai
 */
function reflipCard(onComplete) {
  state.isAnimating = true;

  const flipper = dom.cardFlipper();

  // Langkah 1: Balik kembali ke depan
  flipper.classList.remove('flipped');
  state.isFlipped = false;

  // Langkah 2: Di tengah, isi pertanyaan baru
  setTimeout(() => {
    if (typeof onComplete === 'function') {
      onComplete(); // isi konten baru
    }

    // Langkah 3: Balik lagi ke belakang
    requestAnimationFrame(() => {
      flipper.classList.add('flipped');
      state.isFlipped = true;
    });
  }, FLIP_DURATION_MS);

  // Langkah 4: Animasi selesai
  setTimeout(() => {
    state.isAnimating = false;
  }, FLIP_DURATION_MS * 2 + 50);
}


/* ═══════════════════════════════════════════════════════════
   7. SESSION COMPLETE — Semua pertanyaan sudah habis
═══════════════════════════════════════════════════════════ */

/**
 * Tampilkan pesan ketika semua pertanyaan dalam sesi sudah habis.
 */
function handleSessionComplete() {
  state.isSessionComplete = true;

  // Jika kartu belum terbalik, balik dulu
  if (!state.isFlipped) {
    dom.cardFlipper().classList.add('flipped');
    state.isFlipped = true;
  }

  const cardBack = dom.cardBack();
  cardBack.classList.add('session-complete');

  // Tampilkan pesan selesai di dalam kartu
  const content = cardBack.querySelector('.card-back-content');
  content.innerHTML = `
    <div class="session-complete-content">
      <div class="session-complete-icon">✦</div>
      <p class="session-complete-title">Semua pertanyaan sudah terbuka</p>
      <p class="session-complete-subtitle">
        Kamu telah membuka <strong>${state.cardCount}</strong> pertanyaan dalam sesi ini.<br />
        Tekan tombol di bawah untuk memulai sesi baru.
      </p>
    </div>
  `;

  updateProgress();
  updateButtons('complete');

  // Update progress text
  dom.progressText().textContent =
    `Selesai — ${state.cardCount} pertanyaan dibuka`;
}


/* ═══════════════════════════════════════════════════════════
   8. PAGE NAVIGATION
═══════════════════════════════════════════════════════════ */

/**
 * Tampilkan halaman yang dituju, sembunyikan halaman lainnya.
 *
 * @param {'landing'|'main'} pageName - Nama halaman yang ingin ditampilkan
 */
function showPage(pageName) {
  const pages = {
    landing: dom.landingPage(),
    main:    dom.mainPage(),
  };

  // Nonaktifkan semua halaman
  Object.values(pages).forEach(page => {
    page.classList.remove('active');
  });

  // Aktifkan halaman yang diminta
  if (pages[pageName]) {
    pages[pageName].classList.add('active');
  }

  // [FUTURE] Tambahkan routing URL di sini (history.pushState)
}


/* ═══════════════════════════════════════════════════════════
   9. UTILITIES
═══════════════════════════════════════════════════════════ */

/**
 * Acak urutan elemen dalam array menggunakan Fisher-Yates shuffle.
 * Tidak memodifikasi array asli — mengembalikan array baru.
 *
 * @template T
 * @param {T[]} array - Array yang ingin diacak
 * @returns {T[]} Array baru dengan urutan acak
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// [FUTURE] function getQuestionsByCategory(category) { ... }
// [FUTURE] function addToFavorites(question) { ... }
// [FUTURE] function shareQuestion(question) { ... }
// [FUTURE] function getDailyQuestion() { ... }
// [FUTURE] function toggleDarkMode() { ... }
// [FUTURE] function saveToJournal(question, reflection) { ... }
// [FUTURE] function searchByKeyword(keyword) { ... }


/* ═══════════════════════════════════════════════════════════
   10. ENTRY POINT
═══════════════════════════════════════════════════════════ */

// Jalankan saat DOM selesai dimuat
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOMContentLoaded sudah terjadi (script di bawah body)
  init();
}
