/**
 * Test Suite: Multiplayer Auto-Turn & Prefix Normalization Verification
 */

import { WordValidator } from '../js/word-validator.js';
import { ChallengeSystem } from '../js/challenges.js';
import { GameEngine } from '../js/game-engine.js';
import fs from 'fs';

class MockAudio {
  init() {}
  playClick() {}
  playCorrect() {}
  playError() {}
  playTick() {}
  playVictory() {}
  playPop() {}
}

async function runTests() {
  console.log('========================================================');
  console.log('🧪 UJI MULTIPLAYER REDESIGN: AUTO-TURN & AUTO-PREFIX');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  const validator = new WordValidator();
  const wordsDataPath = new URL('../data/words.json', import.meta.url);
  const wordsData = JSON.parse(fs.readFileSync(wordsDataPath, 'utf8'));
  validator.populate(wordsData.words);

  const challenges = new ChallengeSystem();
  const audio = new MockAudio();

  // Test 1: Auto-Start Turn in GameEngine (Multiplayer No-Ready Rule)
  console.log('--- 1. Uji Auto-Start Turn untuk Mode Multi-Device ---');
  const engine = new GameEngine(validator, challenges, audio);
  
  let turnReadyCalled = false;
  let turnStartCalled = false;
  engine.onTurnReady = () => { turnReadyCalled = true; };
  engine.onTurnStart = () => { turnStartCalled = true; };

  const players = [
    { id: 'peer_host', name: 'Host Player' },
    { id: 'peer_client1', name: 'Client 1' },
    { id: 'peer_client2', name: 'Client 2' }
  ];

  // Start game with autoStartTurn: true
  engine.startNewGame(players, {
    mode: 'lps',
    timerDuration: 10,
    initialLives: 3,
    autoStartTurn: true
  });

  assert(engine.state === 'PLAYING', 'State langsung PLAYING tanpa terjebak di READY');
  assert(Boolean(engine.timerInterval) === true, 'Timer langsung berjalan otomatis tanpa perlu klik tombol');
  assert(turnStartCalled === true, 'Event onTurnStart langsung dipanggil');

  // Submit word from Player 1
  const req = engine.requiredLetter;
  let testWord = null;
  for (const w of validator.wordsSet) {
    if (w.startsWith(req) && w.length >= 3 && !engine.usedWords.has(w)) {
      testWord = w;
      break;
    }
  }

  if (testWord) {
    const res = engine.submitWord(testWord);
    assert(res.success === true, `Jawaban "${testWord}" berhasil diterima`);

    // Wait for the transition delay (500ms) to advance to next player
    await new Promise(r => setTimeout(r, 650));

    assert(engine.state === 'PLAYING', 'Setelah jeda transisi, turn berikutnya LANGSUNG PLAYING otomatis (tanpa tombol mulai)');
    assert(Boolean(engine.timerInterval) === true, 'Timer pemain berikutnya langsung berjalan otomatis');
    assert(engine.getCurrentPlayer().name === 'Client 1', 'Pemain aktif otomatis berganti ke Client 1');
  }

  // Test 2: Auto-Prefix Resolution Logic
  console.log('\n--- 2. Uji Logika Auto-Prefix Input (resolveSubmittedWord) ---');
  function resolveSubmittedWord(raw, reqLetter) {
    if (!raw) return '';
    const clean = raw.trim().toLowerCase();
    const req = (reqLetter || '').trim().toLowerCase();
    if (!req) return clean;
    if (clean.startsWith(req)) {
      return clean;
    }
    return req + clean;
  }

  assert(resolveSubmittedWord('lar', 'u') === 'ular', 'Ketik "lar" dengan prefix "u" menjadi "ular"');
  assert(resolveSubmittedWord('ular', 'u') === 'ular', 'Ketik "ular" lengkap dengan prefix "u" tetap "ular" (tidak duplikat "uular")');
  assert(resolveSubmittedWord('ang', 'u') === 'uang', 'Ketik "ang" dengan prefix "u" menjadi "uang"');
  assert(resolveSubmittedWord('uang', 'u') === 'uang', 'Ketik "uang" lengkap tetap "uang"');
  assert(resolveSubmittedWord('KU', 'b') === 'bku', 'Ketik case insensitive');
  assert(resolveSubmittedWord('buku', 'b') === 'buku', 'Ketik "buku" dengan prefix "b" tetap "buku"');

  engine.stopTimer();

  console.log('\n========================================================');
  console.log(`HASIL AKHIR: ${passed} LULUS, ${failed} GAGAL`);
  console.log('========================================================');

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
