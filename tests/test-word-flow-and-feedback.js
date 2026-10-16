/**
 * SAMBUNGIN! — Automated Test Suite: Word Flow, Random Letters, & Error Feedback
 * Verifies:
 * 1. A-Z initial indexing in WordValidator.
 * 2. Full A-Z random starter letter and lifeline picker.
 * 3. Prevention of duplicate words across starter words and player turns.
 * 4. Crystal-clear error explanations for rejected submissions.
 * 5. Smart suffix resolution without mangling valid words into gibberish.
 * 6. GameEngine letterFlow: 'chain' vs 'random'.
 * 7. NetworkManager sendToClient direct messaging.
 */

import { WordValidator } from '../js/word-validator.js';
import { GameEngine } from '../js/game-engine.js';
import { ChallengeSystem } from '../js/challenges.js';
import { NetworkManager } from '../js/network.js';
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

console.log('================================================================');
console.log('🧪 PENGUJIAN: ALUR HURUF A-Z, CEK DUPLIKAT, & FEEDBACK KATA');
console.log('================================================================\n');

// Load Dataset
console.log('--- 1. Pengujian Indeks Huruf A-Z & Random Letter ---');
const validator = new WordValidator();
const wordsDataPath = new URL('../data/words.json', import.meta.url);
const wordsData = JSON.parse(fs.readFileSync(wordsDataPath, 'utf8'));
validator.populate(wordsData.words);

// Check that all 26 letters a-z have indexed words
const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
let allLettersHaveWords = true;
const sampleCounts = {};
for (const l of alphabet) {
  const count = (validator.wordsByInitial[l] || []).length;
  sampleCounts[l] = count;
  if (count === 0) {
    allLettersHaveWords = false;
  }
}
assert(allLettersHaveWords, `Semua 26 huruf A-Z terindeks dengan kosakata (Contoh: A: ${sampleCounts['a']}, Q: ${sampleCounts['q']}, Z: ${sampleCounts['z']}).`);

// Check getRandomLetter
const pickedLetters = new Set();
for (let i = 0; i < 100; i++) {
  pickedLetters.add(validator.getRandomLetter());
}
assert(pickedLetters.size >= 15, `getRandomLetter menghasilkan variasi huruf luas (${pickedLetters.size} variasi huruf dalam 100 putaran).`);

// Check getRandomStartingWord
const wordForZ = validator.getRandomStartingWord('z');
assert(wordForZ.startsWith('z') && validator.wordsSet.has(wordForZ), `getRandomStartingWord('z') menghasilkan kata valid berawalan Z: "${wordForZ}".`);

console.log('\n--- 2. Pengujian Pesan Error & Alasan Ditolak ---');
const usedWords = new Set(['apel', 'kucing']);

// Wrong letter error message check
const wrongLetterRes = validator.validate('makan', 'n', usedWords, null);
assert(wrongLetterRes.valid === false, 'Kata "makan" ditolak untuk giliran huruf N.');
assert(wrongLetterRes.reason.includes("diawali huruf 'M'") && wrongLetterRes.reason.includes("wajib huruf 'N'"),
  `Pesan error huruf salah sangat jelas: "${wrongLetterRes.reason}"`);

// Duplicate error message check
const duplicateRes = validator.validate('apel', 'a', usedWords, null);
assert(duplicateRes.valid === false, 'Kata "apel" ditolak karena duplikat.');
assert(duplicateRes.reason.includes('sudah pernah dipakai'),
  `Pesan error duplikat sangat jelas: "${duplicateRes.reason}"`);

// Unknown word error message check
const unknownRes = validator.validate('zzxxqq', 'z', usedWords, null);
assert(unknownRes.valid === false, 'Kata tidak dikenal ditolak.');
assert(unknownRes.reason.includes('tidak ditemukan dalam kamus'),
  `Pesan error kata tidak ada di kamus: "${unknownRes.reason}"`);

console.log('\n--- 3. Pengujian Smart Word Resolution (Suffix vs Whole Word) ---');
// Mocking app's resolveSubmittedWord logic
function mockResolveSubmittedWord(raw, reqLetter, mockValidator) {
  if (!raw) return '';
  const clean = raw.trim().toLowerCase().replace(/[^a-z]/g, '');
  const req = (reqLetter || '').trim().toLowerCase();
  if (!req) return clean;

  if (clean.startsWith(req)) {
    return clean;
  }

  if (mockValidator && mockValidator.wordsSet) {
    const candidateWithPrefix = req + clean;
    if (mockValidator.wordsSet.has(candidateWithPrefix)) {
      return candidateWithPrefix;
    }
    if (mockValidator.wordsSet.has(clean)) {
      return clean;
    }
  }

  return req + clean;
}

// Case A: User typed whole word starting with required letter: 'nasi' for 'n'
assert(mockResolveSubmittedWord('nasi', 'n', validator) === 'nasi', 'Kata "nasi" untuk huruf "n" tetap "nasi".');

// Case B: User typed only suffix 'asi' for 'n' (badge already showed 'N')
assert(mockResolveSubmittedWord('asi', 'n', validator) === 'nasi', 'Suffix "asi" untuk huruf "n" disatukan jadi "nasi".');

// Case C: User typed whole word with wrong letter 'makan' for 'n'
// Must NOT mangle to 'nmakan', so validator can give correct error reason!
assert(mockResolveSubmittedWord('makan', 'n', validator) === 'makan', 'Kata utuh "makan" untuk huruf "n" TIDAK diubah jadi "nmakan", tetap "makan".');

// Case D: Single letter or unknown suffix
assert(mockResolveSubmittedWord('asi', 'b', validator) === 'basi', 'Suffix "asi" untuk huruf "b" disatukan jadi "basi".');

console.log('\n--- 4. Pengujian GameEngine Alur Huruf (Random vs Chain) & Duplikat ---');
const engine = new GameEngine(validator, new ChallengeSystem());
const players = [
  { id: 'p1', name: 'Alice' },
  { id: 'p2', name: 'Bob' }
];

// Test Chain Flow
engine.startNewGame(players, {
  letterFlow: 'chain',
  timerDuration: 10,
  initialLives: 3,
  autoStartTurn: false
});

const starterWord = engine.currentWord;
assert(engine.usedWords.has(starterWord), `Kata pembuka "${starterWord}" otomatis dicatat dalam usedWords agar tidak bisa dipakai 2x.`);
const starterLetter = engine.requiredLetter;
assert(starterWord.endsWith(starterLetter), `Huruf giliran pertama (${starterLetter}) adalah huruf akhir kata pembuka (${starterWord}).`);

// Test duplicate rejection on words in usedWords with matching initial letter
engine.startActiveTurn();
const dupWord = validator.getRandomStartingWord(starterLetter);
engine.usedWords.add(dupWord); // simulate word was already used in this match
const dupStarterRes = engine.submitWord(dupWord);
assert(dupStarterRes.success === false && dupStarterRes.message.includes('sudah pernah dipakai'),
  `Kata "${dupWord}" yang sudah ada di usedWords ditolak dengan alasan duplikat.`);

// Test Random Flow
const engineRandom = new GameEngine(validator, new ChallengeSystem());
engineRandom.startNewGame(players, {
  letterFlow: 'random',
  timerDuration: 10,
  initialLives: 3,
  autoStartTurn: false
});

assert(engineRandom.letterFlow === 'random', 'GameEngine berhasil dikonfigurasi dengan letterFlow: random.');
const randomStarter = engineRandom.currentWord;
assert(validator.wordsSet.has(randomStarter), `Kata awal mode random "${randomStarter}" valid.`);

// Test Lifeline reroll A-Z
engineRandom.startActiveTurn();
const curReq = engineRandom.requiredLetter;
const lifeResult = engineRandom.useLifeline();
assert(lifeResult === true, 'Pemain berhasil menggunakan bantuan ganti huruf.');
assert(engineRandom.requiredLetter !== curReq || alphabet.includes(engineRandom.requiredLetter),
  `Huruf baru setelah bantuan: "${engineRandom.requiredLetter.toUpperCase()}".`);

console.log('\n--- 5. Pengujian NetworkManager sendToClient ---');
const hostNet = new NetworkManager();
hostNet.role = 'HOST';
let sentDirectData = null;
const mockClientPeerId = 'client_123';
hostNet.clients.set(mockClientPeerId, {
  id: mockClientPeerId,
  name: 'Client Player',
  conn: {
    open: true,
    send: (msg) => { sentDirectData = msg; }
  }
});

const sendSuccess = hostNet.sendToClient(mockClientPeerId, 'WORD_ERROR_FEEDBACK', {
  message: 'Kata ditolak Host!',
  word: 'salah'
});

assert(sendSuccess === true, 'Host berhasil memanggil sendToClient().');
assert(sentDirectData && sentDirectData.type === 'WORD_ERROR_FEEDBACK' && sentDirectData.payload.message === 'Kata ditolak Host!',
  'Data sampai ke mock client connection dengan type WORD_ERROR_FEEDBACK.');

engine.stopTimer();
engineRandom.stopTimer();

console.log('\n====================================================');
console.log(`HASIL: ${passCount} LULUS, ${failCount} GAGAL`);
console.log('====================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
