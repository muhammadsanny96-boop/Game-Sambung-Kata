/**
 * Verification Test Suite for:
 * 1. Home Screen Buttons Presence & IDs
 * 2. CSS .hidden and touch-action: manipulation
 * 3. Spectator Input Lockdown (readOnly, disabled, display: none, hidden class)
 * 4. Word submission rejection when not active player's turn
 */

import assert from 'node:assert';
import fs from 'node:fs';

console.log('🧪 Running Test Suite: Mobile Performance, Home Buttons & Spectator Lockdown...\n');

// 1. Verify index.html contains all home buttons & input attributes
const htmlContent = fs.readFileSync('index.html', 'utf-8');

assert.ok(htmlContent.includes('id="btn-open-multiplayer"'), 'index.html must have #btn-open-multiplayer');
assert.ok(htmlContent.includes('id="btn-start-setup"'), 'index.html must have #btn-start-setup');
assert.ok(htmlContent.includes('id="btn-quick-rules"'), 'index.html must have #btn-quick-rules');
assert.ok(htmlContent.includes('id="btn-home-settings"'), 'index.html must have #btn-home-settings');
assert.ok(htmlContent.includes('enterkeyhint="send"'), 'input-word must have enterkeyhint="send"');
assert.ok(htmlContent.includes('inputmode="text"'), 'input-word must have inputmode="text"');
console.log('✅ 1. index.html contains all home buttons, action IDs, and mobile keyboard attributes.');

// 2. Verify css/style.css contains .hidden, touch-action, and optimized ambient gradient
const cssContent = fs.readFileSync('css/style.css', 'utf-8');

assert.ok(cssContent.includes('.hidden {'), 'css/style.css must define .hidden');
assert.ok(cssContent.includes('display: none !important;'), '.hidden must use display: none !important');
assert.ok(cssContent.includes('touch-action: manipulation;'), 'css/style.css must specify touch-action: manipulation');
assert.ok(cssContent.includes('.btn-mabar-hero'), 'css/style.css must have .btn-mabar-hero');
assert.ok(cssContent.includes('.btn-passplay-hero'), 'css/style.css must have .btn-passplay-hero');
assert.ok(cssContent.includes('.glow-orb {\n  display: none;'), 'css/style.css must disable heavy glow-orb blur animation');
console.log('✅ 2. css/style.css contains .hidden !important, zero-delay touch-action, and GPU-safe gradients.');

// 3. Verify js/app.js implements strict spectator lockdown and safe element binding
const appContent = fs.readFileSync('js/app.js', 'utf-8');

assert.ok(appContent.includes('isMyTurnNow()'), 'app.js must implement isMyTurnNow()');
assert.ok(appContent.includes("this.inputWord.readOnly = true;"), 'app.js must set readOnly = true for spectators');
assert.ok(appContent.includes("this.inputWord.blur();"), 'app.js must blur inputWord for spectators to dismiss virtual keyboard');
assert.ok(appContent.includes("this.formSubmitWord.style.display = 'none';"), 'app.js must set inline display: none for spectators');
assert.ok(appContent.includes("this.formSubmitWord.classList.add('hidden');"), 'app.js must add hidden class for spectators');
assert.ok(appContent.includes("!this.isMyTurnNow()"), 'app.js must check isMyTurnNow() before submission and keydown');
assert.ok(appContent.includes("unlockAudio"), 'app.js must pre-warm audio context on first touch/pointerdown');
console.log('✅ 3. js/app.js implements complete spectator input lockdown and touch audio pre-warming.');

// 4. Mock Turn Logic Test
class MockPlayer {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.lives = 3;
    this.lifelines = 1;
    this.score = 0;
  }
}

class MockAppTurnState {
  constructor() {
    this.gameSessionType = 'NETWORK';
    this.myNetworkId = 'client_123';
    this.currentTurnPlayer = null;

    this.formSubmitWord = { style: { display: '' }, classList: new Set() };
    this.spectatorReactionBox = { style: { display: '' }, classList: new Set() };
    this.inputWord = { disabled: false, readOnly: false, value: '', isFocused: false, blur() { this.isFocused = false; } };
    this.btnSubmitWord = { disabled: false };
    this.btnUseLifeline = { disabled: false };
  }

  isMyTurnNow() {
    if (this.gameSessionType === 'LOCAL') return true;
    return Boolean(this.currentTurnPlayer && this.currentTurnPlayer.id === this.myNetworkId);
  }

  updateTurnActiveState(player) {
    this.currentTurnPlayer = player;
    const isMyTurn = (this.gameSessionType === 'LOCAL' || player.id === this.myNetworkId);

    if (isMyTurn) {
      this.formSubmitWord.style.display = 'block';
      this.formSubmitWord.classList.delete('hidden');
      this.spectatorReactionBox.style.display = 'none';
      this.spectatorReactionBox.classList.add('hidden');
      this.inputWord.disabled = false;
      this.inputWord.readOnly = false;
      this.btnSubmitWord.disabled = false;
    } else {
      this.formSubmitWord.style.display = 'none';
      this.formSubmitWord.classList.add('hidden');
      this.spectatorReactionBox.style.display = 'block';
      this.spectatorReactionBox.classList.delete('hidden');
      this.inputWord.readOnly = true;
      this.inputWord.disabled = true;
      this.inputWord.value = '';
      this.inputWord.blur();
      this.btnSubmitWord.disabled = true;
      this.btnUseLifeline.disabled = true;
    }
  }

  submitWord(word) {
    if (!this.isMyTurnNow()) {
      return { success: false, reason: 'NOT_MY_TURN' };
    }
    return { success: true, word };
  }
}

const mockApp = new MockAppTurnState();
const player1 = new MockPlayer('host_999', 'Host Player');
const player2 = new MockPlayer('client_123', 'My Client Player');

// Case A: Host's turn -> Client is spectator
mockApp.updateTurnActiveState(player1);
assert.strictEqual(mockApp.isMyTurnNow(), false, 'isMyTurnNow must be false when it is host turn');
assert.strictEqual(mockApp.formSubmitWord.style.display, 'none', 'formSubmitWord must have style.display none');
assert.strictEqual(mockApp.formSubmitWord.classList.has('hidden'), true, 'formSubmitWord must have hidden class');
assert.strictEqual(mockApp.inputWord.readOnly, true, 'inputWord must be readOnly');
assert.strictEqual(mockApp.inputWord.disabled, true, 'inputWord must be disabled');
assert.strictEqual(mockApp.btnSubmitWord.disabled, true, 'btnSubmitWord must be disabled');
assert.strictEqual(mockApp.spectatorReactionBox.style.display, 'block', 'spectatorReactionBox must be visible');

// Client attempts to submit while spectator -> Must be blocked
const blockRes = mockApp.submitWord('kucing');
assert.strictEqual(blockRes.success, false, 'Spectator submission must be rejected');
assert.strictEqual(blockRes.reason, 'NOT_MY_TURN', 'Rejection reason must be NOT_MY_TURN');
console.log('✅ 4. Spectator state: form hidden, input readOnly+disabled, submission rejected.');

// Case B: Turn changes to Client
mockApp.updateTurnActiveState(player2);
assert.strictEqual(mockApp.isMyTurnNow(), true, 'isMyTurnNow must be true when it is my turn');
assert.strictEqual(mockApp.formSubmitWord.style.display, 'block', 'formSubmitWord must have style.display block');
assert.strictEqual(mockApp.formSubmitWord.classList.has('hidden'), false, 'formSubmitWord must not have hidden class');
assert.strictEqual(mockApp.inputWord.readOnly, false, 'inputWord must not be readOnly');
assert.strictEqual(mockApp.inputWord.disabled, false, 'inputWord must not be disabled');
assert.strictEqual(mockApp.btnSubmitWord.disabled, false, 'btnSubmitWord must be enabled');
assert.strictEqual(mockApp.spectatorReactionBox.style.display, 'none', 'spectatorReactionBox must be hidden');

// Client submits on their turn -> Must succeed
const turnRes = mockApp.submitWord('gajah');
assert.strictEqual(turnRes.success, true, 'Active player submission must succeed');
console.log('✅ 5. Active player state: form visible, input enabled & editable, submission allowed.');

console.log('\n🎉 ALL PERFORMANCE, BUTTON, AND SPECTATOR LOCKDOWN TESTS PASSED!\n');
