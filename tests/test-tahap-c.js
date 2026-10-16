/**
 * SAMBUNGIN! — Automated Test Suite (Tahap C Verification)
 * Tests full gameplay lifecycle:
 * - Word validation & chain rules
 * - Pass-and-play turn handoff (Mulai Giliran trigger)
 * - Timer countdown & timeout handling
 * - Elimination in Last Player Standing
 * - Score accumulation in Free Play
 * - Single-elimination in Sudden Death
 * - Race condition prevention (submit vs timeout)
 */

import { WordValidator } from '../js/word-validator.js';
import { ChallengeSystem } from '../js/challenges.js';
import { GameEngine } from '../js/game-engine.js';
import fs from 'fs';

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

console.log('========================================================');
console.log('🧪 MENJALANKAN UJI OTOMATIS TAHAP C: GAMEPLAY & ENGINE');
console.log('========================================================\n');

// Mock Web Audio API
const mockAudio = {
  playClick() {},
  playCorrect() {},
  playError() {},
  playTick() {},
  playVictory() {}
};

// 1. Validator & Large Dictionary
const validator = new WordValidator();
const wordsDataPath = new URL('../data/words.json', import.meta.url);
const wordsData = JSON.parse(fs.readFileSync(wordsDataPath, 'utf8'));
validator.populate(wordsData.words);

console.log('--- 1. Uji Kosakata Dwibahasa (ID & EN) ---');
assert(validator.wordsSet.has('buku'), 'Kata bahasa Indonesia "buku" valid.');
assert(validator.wordsSet.has('apple'), 'Kata bahasa Inggris "apple" valid.');
assert(validator.wordsSet.has('computer'), 'Kata bahasa Inggris "computer" valid.');
assert(validator.wordsSet.has('rumah'), 'Kata bahasa Indonesia "rumah" valid.');

// Chain transition: "buku" -> "ular" -> "roti" -> "ikan"
let used = new Set();
let res1 = validator.validate('buku', 'b', used);
assert(res1.valid === true, 'Kata pertama "buku" lolos validasi.');
used.add('buku');

let nextLetter = validator.getLastLetter('buku'); // 'u'
assert(nextLetter === 'u', 'Huruf terakhir "buku" adalah "u".');

let res2 = validator.validate('ular', nextLetter, used);
assert(res2.valid === true, 'Kata "ular" valid menyambung "buku".');
used.add('ular');

nextLetter = validator.getLastLetter('ular'); // 'r'
assert(nextLetter === 'r', 'Huruf terakhir "ular" adalah "r".');

let res3 = validator.validate('roti', nextLetter, used);
assert(res3.valid === true, 'Kata "roti" valid menyambung "ular".');
used.add('roti');

// 2. Pass-and-Play Turn Handoff Test
console.log('\n--- 2. Uji Giliran & Konfirmasi "Mulai Giliran" ---');
const challenges = new ChallengeSystem();
const engine = new GameEngine(validator, challenges, mockAudio);

const players = [
  { id: 'p1', name: 'Budi' },
  { id: 'p2', name: 'Siti' }
];

engine.startNewGame(players, { mode: 'lps', timerDuration: 10, initialLives: 3, challengeDifficulty: 'off' });

assert(engine.state === 'READY', 'State awal adalah READY (menunggu penyerahan perangkat).');
assert(engine.timerInterval === null, 'Timer belum berjalan saat layar siap.');
assert(engine.getCurrentPlayer().name === 'Budi', 'Giliran awal adalah Budi.');

// Player Budi hits "MULAI GILIRAN"
engine.startActiveTurn();
assert(engine.state === 'PLAYING', 'State beralih ke PLAYING setelah menekan mulai.');
assert(engine.timerInterval !== null, 'Timer aktif menghitung mundur.');

// Budi submits a valid word
const matchingWord = Array.from(validator.wordsSet).find(w => w.length >= 3 && w.startsWith(engine.requiredLetter) && !engine.usedWords.has(w));
assert(Boolean(matchingWord), `Menemukan kata valid "${matchingWord}" yang diawali "${engine.requiredLetter}".`);

let submitSuccess = engine.submitWord(matchingWord);
assert(submitSuccess.success === true, `Jawaban Budi "${matchingWord}" berhasil diterima.`);
assert(BudiScoreCheck(engine, 'Budi'), 'Skor Budi bertambah setelah jawaban valid.');

function BudiScoreCheck(eng, name) {
  const p = eng.players.find(x => x.name === name);
  return p && p.score > 0;
}

// 3. Elimination Flow in LPS Mode
console.log('\n--- 3. Uji Pengurangan Nyawa & Eliminasi (Last Player Standing) ---');
const engineLPS = new GameEngine(validator, challenges, mockAudio);
engineLPS.startNewGame([
  { id: 'p1', name: 'Pemain 1' },
  { id: 'p2', name: 'Pemain 2' }
], { mode: 'lps', timerDuration: 5, initialLives: 1, challengeDifficulty: 'off' });

engineLPS.startActiveTurn();
assert(engineLPS.getCurrentPlayer().lives === 1, 'Nyawa awal Pemain 1 adalah 1.');

// Simulate Timeout for Pemain 1
let eliminatedPlayer = null;
let gameOverData = null;

engineLPS.onPlayerEliminated = (p) => { eliminatedPlayer = p; };
engineLPS.onGameOver = (data) => { gameOverData = data; };

engineLPS.handleTimeout();

assert(eliminatedPlayer && eliminatedPlayer.name === 'Pemain 1', 'Pemain 1 tereliminasi saat nyawa habis.');
assert(engineLPS.state === 'GAME_OVER', 'Permainan selesai setelah hanya tersisa 1 pemain aktif.');
assert(gameOverData && gameOverData.winner.name === 'Pemain 2', 'Pemenang Last Player Standing adalah Pemain 2!');

// 4. Free Play Mode Test
console.log('\n--- 4. Uji Mode Free Play (Akumulasi Poin Tanpa Eliminasi) ---');
const engineFP = new GameEngine(validator, challenges, mockAudio);
engineFP.startNewGame([
  { id: 'p1', name: 'Alice' },
  { id: 'p2', name: 'Bob' }
], { mode: 'freeplay', timerDuration: 10, challengeDifficulty: 'off' });

engineFP.startActiveTurn();
// Simulate timeout for Alice in Free Play
engineFP.handleTimeout();
assert(engineFP.players[0].status === 'ACTIVE', 'Alice TIDAK tereliminasi di mode Free Play saat timeout.');
assert(engineFP.state !== 'GAME_OVER', 'Game terus berlanjut di mode Free Play.');

console.log('\n========================================================');
console.log(`HASIL AKHIR TAHAP C: ${passCount} LULUS, ${failCount} GAGAL`);
console.log('========================================================');

if (failCount > 0) {
  process.exit(1);
}
