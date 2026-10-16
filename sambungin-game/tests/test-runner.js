/**
 * SAMBUNGIN! — Automated Test Runner (Tahap B & Logic Verification)
 * Tests core components: WordValidator, ChallengeSystem, GameEngine,
 * player management rules, turn handoff flow, and timer lifecycle.
 */

import { WordValidator } from '../js/word-validator.js';
import { ChallengeSystem } from '../js/challenges.js';
import { GameEngine } from '../js/game-engine.js';
import fs from 'fs';
import path from 'path';

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
  }
}

console.log('====================================================');
console.log('🧪 MENJALANKAN PENGUJIAN OTOMATIS TAHAP B & LOGIKA');
console.log('====================================================\n');

// 1. Test Dataset & WordValidator
console.log('--- 1. Pengujian WordValidator & Kamus Lokal ---');
const validator = new WordValidator();
const wordsDataPath = new URL('../data/words.json', import.meta.url);
const wordsData = JSON.parse(fs.readFileSync(wordsDataPath, 'utf8'));
validator.populate(wordsData.words);

assert(validator.wordsSet.size > 0, `Kamus berhasil dimuat: ${validator.wordsSet.size} kata terdaftar.`);
assert(validator.normalize('  BUKU! 123 ') === 'buku', 'Normalisasi kata membuang spasi, angka, tanda baca, dan lowercase.');

// Valid chain test: BUKU -> ULAR
const usedWords = new Set(['buku']);
const check1 = validator.validate('ular', 'u', usedWords, null);
assert(check1.valid === true, 'Kata "ular" valid diawali huruf "u" dan terdaftar di kamus.');

// Invalid first letter: BUKU -> ROTI (harus diawali 'u')
const check2 = validator.validate('roti', 'u', usedWords, null);
assert(check2.valid === false && check2.reason.includes("'U'"), 'Kata "roti" ditolak karena tidak diawali huruf "u".');

// Duplicate word: 'buku' already used
const check3 = validator.validate('buku', 'b', usedWords, null);
assert(check3.valid === false && check3.reason.includes('pernah dipakai'), 'Kata "buku" ditolak karena duplikat.');

// Unknown word in local dictionary
const check4 = validator.validate('xyzabc', 'x', usedWords, null);
assert(check4.valid === false && check4.reason.includes('tidak ditemukan'), 'Kata asing ditolak karena tidak ada di kamus lokal.');

// 2. Test ChallengeSystem
console.log('\n--- 2. Pengujian ChallengeSystem (8 Mekanik) ---');
const challenges = new ChallengeSystem();
let rolledAny = false;
for (let i = 0; i < 20; i++) {
  const c = challenges.rollChallenge('chaos', 'lps', 'a');
  if (c) rolledAny = true;
}
assert(rolledAny === true, 'Challenge roll sistem berfungsi menghasilkan tantangan pada level chaos.');

// Test Banned Letter constraint
const bannedChallenge = { id: 'banned_letter', type: 'banned_letter', letter: 'e' };
const bannedCheck1 = validator.validateChallenge('ikan', bannedChallenge);
assert(bannedCheck1.valid === true, 'Kata "ikan" lolos larangan huruf "e".');
const bannedCheck2 = validator.validateChallenge('apel', bannedChallenge);
assert(bannedCheck2.valid === false, 'Kata "apel" gagal tantangan karena mengandung huruf "e".');

// Test Min Length constraint
const minLengthChallenge = { id: 'min_length', type: 'min_length', minLength: 6 };
const lenCheck1 = validator.validateChallenge('semangka', minLengthChallenge);
assert(lenCheck1.valid === true, 'Kata "semangka" (8 huruf) lolos panjang minimal 6.');
const lenCheck2 = validator.validateChallenge('roti', minLengthChallenge);
assert(lenCheck2.valid === false, 'Kata "roti" (4 huruf) ditolak karena kurang dari 6 huruf.');

// 3. Test GameEngine State & Pass-and-Play Turn Handoff
console.log('\n--- 3. Pengujian GameEngine & Fitur "Ketik Mulai Dulu Baru Waktu Jalan" ---');
const mockAudio = {
  playClick() {},
  playCorrect() {},
  playError() {},
  playTick() {},
  playVictory() {}
};

const engine = new GameEngine(validator, challenges, mockAudio);
const initialPlayers = [
  { id: 'p1', name: 'Pemain 1' },
  { id: 'p2', name: 'Pemain 2' }
];

let turnReadyTriggered = false;
let readyDataReceived = null;
engine.onTurnReady = (data) => {
  turnReadyTriggered = true;
  readyDataReceived = data;
};

engine.startNewGame(initialPlayers, { mode: 'lps', timerDuration: 10, initialLives: 3 });

assert(engine.state === 'READY', 'State game masuk ke "READY" saat inisialisasi awal (bukan langsung PLAYING).');
assert(engine.timerInterval === null, 'Timer TIDAK berjalan otomatis pada status READY (waktu belum jalan).');
assert(turnReadyTriggered === true, 'Event onTurnReady terpanggil untuk menampilkan layar "Oper Perangkat & Mulai Giliran".');
assert(readyDataReceived.player.name === 'Pemain 1', 'Pemain pertama pada giliran awal adalah "Pemain 1".');

// Now simulate player clicking "MULAI GILIRAN SEKARANG"
let turnStarted = false;
engine.onTurnStart = () => {
  turnStarted = true;
};
engine.startActiveTurn();

assert(engine.state === 'PLAYING', 'Setelah menekan "MULAI GILIRAN", state berpindah ke "PLAYING".');
assert(engine.timerInterval !== null, 'Timer AKTIF dan waktu mulai berjalan setelah tombol mulai ditekan.');
assert(turnStarted === true, 'Event onTurnStart terpanggil untuk membuka fokus input.');

// Stop timer for clean exit
engine.stopTimer();

console.log('\n====================================================');
console.log(`HASIL AKHIR: ${passCount} LULUS, ${failCount} GAGAL`);
console.log('====================================================');

if (failCount > 0) {
  process.exit(1);
}
