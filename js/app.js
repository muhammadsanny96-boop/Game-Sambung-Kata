/**
 * SAMBUNGIN! — Main Application Controller (Refactored Orchestrator)
 * Connects UI modules, views, audio, validator, game engine,
 * and WebRTC P2P multi-device networking.
 */

import { WordValidator } from './word-validator.js';
import { ChallengeSystem } from './challenges.js';
import { AudioController } from './audio.js';
import { GameEngine } from './game-engine.js';
import { NetworkManager } from './network.js';

// Modular UI components
import { DomCache } from './ui/dom-cache.js';
import { ScreenManager } from './ui/screens.js';
import { GameArenaUI, escapeHtml } from './ui/game-arena.js';
import { RosterUI } from './ui/roster.js';
import { LobbyUI } from './ui/lobby.js';
import { ResultsUI } from './ui/results.js';
import { bindEvents } from './ui/events.js';

class SambunginApp {
  constructor() {
    this.validator = new WordValidator();
    this.challenges = new ChallengeSystem();
    this.audio = new AudioController();
    this.engine = new GameEngine(this.validator, this.challenges, this.audio);
    this.network = new NetworkManager();

    // UI Modules
    this.dom = new DomCache();
    this.screenMgr = new ScreenManager(this.dom, this);
    this.arenaUI = new GameArenaUI(this.dom, this);
    this.rosterUI = new RosterUI(this.dom, this);
    this.lobbyUI = new LobbyUI(this.dom, this);
    this.resultsUI = new ResultsUI(this.dom, this);

    // Mode Type: 'LOCAL' (1 Device Pass & Play) or 'NETWORK' (Multi-Device P2P)
    this.gameSessionType = 'LOCAL';
    this.myNetworkId = null;

    // Initial Local Player Roster (min 2 players)
    this.players = [
      { id: 'p1', name: 'Pemain 1' },
      { id: 'p2', name: 'Pemain 2' }
    ];

    // Setup Config State
    this.setupConfig = {
      mode: 'lps',
      timer: 10,
      lives: 3,
      challenge: 'normal',
      letterFlow: 'chain' // 'chain' (sambung huruf akhir) or 'random' (acak huruf A-Z)
    };

    // Synchronized set of used words for immediate client rejection
    this.clientUsedWords = new Set();

    // User Preferences (Persisted in localStorage)
    this.prefs = {
      sound: true,
      volume: 80,
      animations: true,
      vibration: true
    };

    this.confettiAnimationId = null;
    this.currentTurnPlayer = null;

    this.loadPersistedData();
    bindEvents(this);
    this.setupEngineHooks();
    this.setupNetworkHooks();
    this.renderPlayerList();
    this.updateSetupConfigUI();
  }

  async init() {
    // Touch/pointer audio pre-warming for zero-latency sound effects on mobile
    const unlockAudio = () => {
      if (this.audio) this.audio.init();
      document.removeEventListener('pointerdown', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
    document.addEventListener('pointerdown', unlockAudio, { passive: true });
    document.addEventListener('touchstart', unlockAudio, { passive: true });

    await this.validator.loadDataset('data/words.json');
    console.log(`[SAMBUNGIN] Kamus siap. ${this.validator.wordsSet.size} kosakata aktif.`);

    // Check for direct join URL parameter (e.g. ?room=ABCD)
    const roomFromUrl = NetworkManager.getRoomFromUrl();
    if (roomFromUrl) {
      this.gameSessionType = 'NETWORK';
      this.showScreen('lobbyClient');
      if (this.dom.inputClientRoomCode) this.dom.inputClientRoomCode.value = roomFromUrl.toUpperCase();
      if (this.dom.clientConnectBox) this.dom.clientConnectBox.classList.remove('hidden');
      if (this.dom.clientWaitingBox) this.dom.clientWaitingBox.classList.add('hidden');
      this.showToast(`Kode room ${roomFromUrl.toUpperCase()} terdeteksi otomatis!`);
      setTimeout(() => {
        if (this.dom.inputClientName) this.dom.inputClientName.focus();
      }, 250);
    }
  }

  // Delegation methods to UI modules
  showScreen(name) { this.screenMgr.showScreen(name); }
  openModal(name) { this.screenMgr.openModal(name); }
  closeModal(name) { this.screenMgr.closeModal(name); }
  showToast(msg, duration) { this.screenMgr.showToast(msg, duration); }

  updateGameArena() { this.arenaUI.updateGameArena(); }
  updateTurnActiveState(player, requiredLetter) { this.arenaUI.updateTurnActiveState(player, requiredLetter); }
  updateTimerDisplay(sec, frac) { this.arenaUI.updateTimerDisplay(sec, frac); }
  setWordFeedback(msg, ok) { this.arenaUI.setWordFeedback(msg, ok); }
  renderWordHistory() { this.arenaUI.renderWordHistory(); }

  renderPlayerList() { this.rosterUI.renderPlayerList(); }
  renderMiniRoster() { this.rosterUI.renderMiniRoster(); }
  renderReadyScreen(data) { this.rosterUI.renderReadyScreen(data); }

  renderHostLobbyPlayers() { this.lobbyUI.renderHostLobbyPlayers(); }
  broadcastLobbyRoster() { this.lobbyUI.broadcastLobbyRoster(); }
  renderClientLobbyPlayers(players) { this.lobbyUI.renderClientLobbyPlayers(players); }

  renderResultsScreen(summary) { this.resultsUI.renderResultsScreen(summary); }
  launchConfetti() { this.resultsUI.launchConfetti(); }

  loadPersistedData() {
    try {
      const savedPlayers = localStorage.getItem('sambungin_players');
      if (savedPlayers) {
        const parsed = JSON.parse(savedPlayers);
        if (Array.isArray(parsed) && parsed.length >= 2) {
          this.players = parsed;
        }
      }

      const savedPrefs = localStorage.getItem('sambungin_prefs');
      if (savedPrefs) {
        this.prefs = { ...this.prefs, ...JSON.parse(savedPrefs) };
      }

      if (this.dom.settingSound) this.dom.settingSound.checked = this.prefs.sound;
      this.audio.setEnabled(this.prefs.sound);

      if (this.dom.settingVolume) this.dom.settingVolume.value = this.prefs.volume;
      this.audio.setVolume(this.prefs.volume);

      if (this.dom.settingAnimations) this.dom.settingAnimations.checked = this.prefs.animations;
      if (this.dom.settingVibration) this.dom.settingVibration.checked = (this.prefs.vibration !== false);
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  saveData() {
    try {
      localStorage.setItem('sambungin_players', JSON.stringify(this.players));
      localStorage.setItem('sambungin_prefs', JSON.stringify(this.prefs));
    } catch (e) {
      console.warn('Cannot write to localStorage:', e);
    }
  }

  triggerHaptic(type = 'turn') {
    if (!this.prefs.vibration || !('vibrate' in navigator)) return;
    try {
      if (type === 'turn') {
        navigator.vibrate([70, 40, 70]);
      } else if (type === 'critical') {
        navigator.vibrate(35);
      } else if (type === 'error') {
        navigator.vibrate([80, 40, 80]);
      } else if (type === 'correct') {
        navigator.vibrate(50);
      }
    } catch (e) {}
  }

  triggerFloatingEmote(emoji) {
    if (!this.dom.floatingEmotesContainer) return;
    const el = document.createElement('div');
    el.className = 'floating-emote';
    el.textContent = emoji;
    const randomLeft = Math.floor(Math.random() * 65) + 15;
    el.style.left = `${randomLeft}%`;
    this.dom.floatingEmotesContainer.appendChild(el);
    setTimeout(() => {
      el.remove();
    }, 2300);
  }

  validateSetupState() {
    if (this.players.length < 2) {
      if (this.dom.setupValidationMsg) this.dom.setupValidationMsg.textContent = 'Minimal harus 2 pemain untuk memulai!';
      if (this.dom.btnStartGame) this.dom.btnStartGame.disabled = true;
      return false;
    }
    if (this.dom.setupValidationMsg) this.dom.setupValidationMsg.textContent = '';
    if (this.dom.btnStartGame) this.dom.btnStartGame.disabled = false;
    return true;
  }

  updateSetupConfigUI() {
    if (this.dom.livesSettingGroup) {
      this.dom.livesSettingGroup.style.display = (this.setupConfig.mode === 'lps') ? 'block' : 'none';
    }
  }

  handleStartGame() {
    if (!this.validateSetupState()) return;

    this.audio.playClick();
    this.clientUsedWords = new Set();
    this.engine.startNewGame(this.players, {
      mode: this.setupConfig.mode,
      timerDuration: this.setupConfig.timer,
      initialLives: this.setupConfig.lives,
      challengeDifficulty: this.setupConfig.challenge,
      letterFlow: this.setupConfig.letterFlow || 'chain'
    });
  }

  setupEngineHooks() {
    this.engine.onTurnReady = (data) => {
      if (this.gameSessionType === 'NETWORK') {
        if (this.network.role === 'HOST') {
          this.engine.startActiveTurn();
        }
        return;
      }
      this.renderReadyScreen(data);
      this.showScreen('ready');
    };

    this.engine.onTurnStart = (data) => {
      this.showScreen('game');
      this.updateGameArena();
      this.renderMiniRoster();
      this.updateTurnActiveState(data.player, data.requiredLetter);

      if (this.gameSessionType === 'NETWORK' && this.network.role === 'HOST') {
        this.network.broadcast('REMOTE_TURN_START', {
          player: data.player,
          remainingTime: data.remainingTime,
          turnDuration: data.turnDuration,
          requiredLetter: data.requiredLetter,
          prevWord: data.prevWord,
          challenge: data.challenge,
          players: this.engine.players
        });
      }
    };

    this.engine.onTick = (seconds, fraction) => {
      this.updateTimerDisplay(seconds, fraction);
      if (seconds <= 3) {
        this.triggerHaptic('critical');
      }

      if (this.gameSessionType === 'NETWORK' && this.network.role === 'HOST') {
        this.network.broadcast('REMOTE_TICK', { seconds, fraction });
      }
    };

    this.engine.onWordAccepted = (data) => {
      this.setWordFeedback(`Benar! +${data.points} Poin`, true);
      this.renderWordHistory();
      this.renderMiniRoster();
      if (this.dom.inputWord) this.dom.inputWord.value = '';
      this.triggerHaptic('correct');

      if (this.gameSessionType === 'NETWORK' && this.network.role === 'HOST') {
        this.network.broadcast('REMOTE_WORD_ACCEPTED', {
          data,
          history: this.engine.wordHistory,
          players: this.engine.players,
          usedWords: Array.from(this.engine.usedWords)
        });
      }
    };

    this.engine.onWordRejected = (data) => {
      this.setWordFeedback(data.reason, false);
      this.renderMiniRoster();
      this.triggerHaptic('error');

      if (data.eliminated) {
        this.showToast(`💀 ${data.player.name} Tereliminasi!`);
      }

      if (this.gameSessionType === 'NETWORK' && this.network.role === 'HOST') {
        this.network.broadcast('REMOTE_WORD_REJECTED', {
          data,
          players: this.engine.players
        });
      }
    };

    this.engine.onPlayerEliminated = (player) => {
      this.showToast(`Pemain ${player.name} telah kehabisan nyawa!`);
    };

    this.engine.onGameOver = (summary) => {
      this.renderResultsScreen(summary);
      this.showScreen('results');
      if (this.prefs.animations) {
        this.launchConfetti();
      }

      if (this.gameSessionType === 'NETWORK' && this.network.role === 'HOST') {
        this.network.broadcast('REMOTE_GAME_OVER', summary);
      }
    };
  }

  setupNetworkHooks() {
    this.network.onPlayerJoined = (playerObj) => {
      this.audio.playCorrect();
      this.showToast(`👋 ${playerObj.name} bergabung ke Room!`);
      this.renderHostLobbyPlayers();
      this.broadcastLobbyRoster();
    };

    this.network.onPlayerLeft = (playerObj) => {
      this.showToast(`🚪 ${playerObj.name} keluar dari Room.`);
      this.renderHostLobbyPlayers();
      this.broadcastLobbyRoster();
    };

    this.network.onMessage = (type, payload, senderPeerId) => {
      this.handleNetworkMessage(type, payload, senderPeerId);
    };

    this.network.onError = (err) => {
      console.warn('[NETWORK ERROR]', err);
      this.showToast(`Koneksi: ${err.message || err}`);
    };
  }

  handleNetworkMessage(type, payload, senderPeerId) {
    if (this.network.role === 'HOST') {
      if (type === 'SUBMIT_WORD') {
        const currentActive = this.engine.getCurrentPlayer();
        if (currentActive && currentActive.id === senderPeerId) {
          const res = this.engine.submitWord(payload.word);
          if (!res.success) {
            this.network.sendToClient(senderPeerId, 'WORD_ERROR_FEEDBACK', { message: res.message, word: payload.word });
          }
        }
      } else if (type === 'CLIENT_USE_LIFELINE') {
        const currentActive = this.engine.getCurrentPlayer();
        if (currentActive && currentActive.id === senderPeerId) {
          const used = this.engine.useLifeline();
          if (used) {
            this.updateGameArena();
            this.network.broadcast('REMOTE_ARENA_SYNC', {
              requiredLetter: this.engine.requiredLetter,
              lifelines: currentActive.lifelines
            });
          }
        }
      } else if (type === 'REACTION_EMOTE') {
        this.triggerFloatingEmote(payload.emoji);
        this.audio.playPop();
        this.network.broadcast('REACTION_EMOTE', payload, senderPeerId);
      }
    }

    if (this.network.role === 'CLIENT') {
      switch (type) {
        case 'LOBBY_ROSTER_UPDATE':
          this.renderClientLobbyPlayers(payload.players);
          break;

        case 'REMOTE_GAME_START':
          this.setupConfig = payload.config;
          this.clientUsedWords = new Set();
          this.showScreen('game');
          this.showToast('Game dimulai!');
          break;

        case 'REMOTE_TURN_START':
          this.handleClientTurnStart(payload);
          break;

        case 'REMOTE_TICK':
          this.updateTimerDisplay(payload.seconds, payload.fraction);
          break;

        case 'WORD_ERROR_FEEDBACK':
          this.audio.playError();
          this.setWordFeedback(payload.message, false);
          this.showToast(`❌ ${payload.message}`);
          this.shakeInput();
          if (this.dom.inputWord) this.dom.inputWord.select();
          this.triggerHaptic('error');
          break;

        case 'REMOTE_WORD_ACCEPTED':
          this.audio.playCorrect();
          this.setWordFeedback(`Benar! +${payload.data.points} Poin`, true);
          this.renderClientWordHistory(payload.history);
          this.renderClientMiniRoster(payload.players);
          if (payload.usedWords && Array.isArray(payload.usedWords)) {
            this.clientUsedWords = new Set(payload.usedWords);
          }
          this.triggerHaptic('correct');
          break;

        case 'REMOTE_WORD_REJECTED':
          this.audio.playError();
          this.setWordFeedback(payload.data.reason, false);
          this.renderClientMiniRoster(payload.players);
          this.triggerHaptic('error');
          if (payload.data.eliminated) {
            this.showToast(`💀 ${payload.data.player.name} Tereliminasi!`);
          }
          break;

        case 'REMOTE_ARENA_SYNC':
          if (this.dom.gameRequiredLetter) this.dom.gameRequiredLetter.textContent = payload.requiredLetter.toUpperCase();
          if (this.dom.inputPrefixLetter) this.dom.inputPrefixLetter.textContent = payload.requiredLetter.toUpperCase();
          if (this.dom.lifelineCount) this.dom.lifelineCount.textContent = payload.lifelines;
          break;

        case 'REACTION_EMOTE':
          this.triggerFloatingEmote(payload.emoji);
          this.audio.playPop();
          break;

        case 'REMOTE_GAME_OVER':
          this.renderResultsScreen(payload);
          this.showScreen('results');
          if (this.prefs.animations) {
            this.launchConfetti();
          }
          break;

        default:
          break;
      }
    }
  }

  async handleCreateHostRoom() {
    const hostName = prompt('Ketik nama kamu sebagai Host:', 'Host') || 'Host';
    this.showScreen('lobbyHost');
    if (this.dom.hostRoomCodeDisplay) this.dom.hostRoomCodeDisplay.textContent = '...';
    if (this.dom.hostValidationMsg) this.dom.hostValidationMsg.textContent = 'Menghubungkan ke jaringan P2P...';

    try {
      const code = await this.network.createRoom(hostName);
      if (this.dom.hostRoomCodeDisplay) this.dom.hostRoomCodeDisplay.textContent = code;
      this.myNetworkId = this.network.myPeerId;
      this.renderHostLobbyPlayers();
      this.showToast(`Room aktif! Bagikan kode ${code} ke teman.`);
    } catch (err) {
      alert(`Gagal membuat room: ${err.message}`);
      this.showScreen('multiChoice');
    }
  }

  handleHostStartGame() {
    const roster = [
      { id: this.network.myPeerId, name: this.network.myName }
    ];
    this.network.clients.forEach(c => {
      roster.push({ id: c.id, name: c.name });
    });

    if (roster.length < 2) {
      alert('Minimal 2 pemain untuk memulai permainan!');
      return;
    }

    this.network.broadcast('REMOTE_GAME_START', {
      config: this.setupConfig,
      players: roster
    });

    this.clientUsedWords = new Set();
    this.engine.startNewGame(roster, {
      mode: this.setupConfig.mode,
      timerDuration: this.setupConfig.timer,
      initialLives: this.setupConfig.lives,
      challengeDifficulty: this.setupConfig.challenge,
      letterFlow: this.setupConfig.letterFlow || 'chain',
      autoStartTurn: true
    });
  }

  async handleClientJoinRoom() {
    const name = this.dom.inputClientName ? this.dom.inputClientName.value.trim() : '';
    const code = this.dom.inputClientRoomCode ? this.dom.inputClientRoomCode.value.trim().toUpperCase() : '';
    if (this.dom.clientJoinError) this.dom.clientJoinError.textContent = '';

    if (!name) {
      if (this.dom.clientJoinError) this.dom.clientJoinError.textContent = 'Nama kamu tidak boleh kosong!';
      return;
    }
    if (!code || code.length < 3) {
      if (this.dom.clientJoinError) this.dom.clientJoinError.textContent = 'Masukkan kode room 4 karakter!';
      return;
    }

    if (this.dom.btnSubmitJoinRoom) this.dom.btnSubmitJoinRoom.disabled = true;
    if (this.dom.clientJoinError) {
      this.dom.clientJoinError.textContent = 'Menghubungkan ke Host...';
      this.dom.clientJoinError.style.color = 'var(--color-accent)';
    }

    try {
      await this.network.joinRoom(code, name);
      this.myNetworkId = this.network.myPeerId;
      if (this.dom.clientConnectBox) this.dom.clientConnectBox.classList.add('hidden');
      if (this.dom.clientWaitingBox) this.dom.clientWaitingBox.classList.remove('hidden');
      if (this.dom.clientRoomTitle) this.dom.clientRoomTitle.textContent = `Room: ${code}`;
      this.showToast(`Berhasil masuk ke Room ${code}!`);
    } catch (err) {
      if (this.dom.clientJoinError) {
        this.dom.clientJoinError.textContent = err.message || 'Gagal terhubung ke room.';
        this.dom.clientJoinError.style.color = 'var(--color-danger)';
      }
      if (this.dom.btnSubmitJoinRoom) this.dom.btnSubmitJoinRoom.disabled = false;
    }
  }

  handleClientTurnStart(payload) {
    this.showScreen('game');
    const { player, requiredLetter, prevWord, challenge, players } = payload;
    this.currentTurnPlayer = player;

    if (this.dom.gameActivePlayerName) this.dom.gameActivePlayerName.textContent = player.name;

    if (this.dom.gamePrevWord) {
      if (prevWord && prevWord.length > 1) {
        const stem = prevWord.slice(0, -1);
        const last = prevWord.slice(-1);
        this.dom.gamePrevWord.innerHTML = `<span class="prev-stem">${escapeHtml(stem.toUpperCase())}</span><span class="prev-last-char">${escapeHtml(last.toUpperCase())}</span>`;
      } else {
        this.dom.gamePrevWord.innerHTML = `<span class="prev-last-char">${escapeHtml((prevWord || '').toUpperCase())}</span>`;
      }
    }

    if (this.dom.gameRequiredLetter) this.dom.gameRequiredLetter.textContent = (requiredLetter || '').toUpperCase();

    if (challenge) {
      if (this.dom.gameChallengeBanner) this.dom.gameChallengeBanner.classList.remove('hidden');
      if (this.dom.challengeIcon) this.dom.challengeIcon.textContent = challenge.icon || '🎯';
      if (this.dom.challengeTitle) this.dom.challengeTitle.textContent = challenge.title;
      if (this.dom.challengeInstruction) this.dom.challengeInstruction.textContent = challenge.instruction;
    } else {
      if (this.dom.gameChallengeBanner) this.dom.gameChallengeBanner.classList.add('hidden');
    }

    this.updateTurnActiveState(player, requiredLetter);
    this.renderClientMiniRoster(players);
  }

  renderClientWordHistory(history) {
    if (!this.dom.historyCount || !this.dom.wordHistoryList) return;
    this.dom.historyCount.textContent = history.length;
    if (!history.length) {
      this.dom.wordHistoryList.innerHTML = '<span class="history-empty">Belum ada kata terhubung</span>';
      return;
    }

    this.dom.wordHistoryList.innerHTML = '';
    history.forEach((item, index) => {
      const chip = document.createElement('span');
      chip.className = `history-tag ${index === 0 ? 'latest' : ''}`;
      chip.textContent = `${item.word.toUpperCase()} (${item.player})`;
      this.dom.wordHistoryList.appendChild(chip);
    });
  }

  renderClientMiniRoster(players) {
    if (!this.dom.gameMiniRoster) return;
    this.dom.gameMiniRoster.innerHTML = '';
    players.forEach(p => {
      const pill = document.createElement('div');
      const isEliminated = p.status === 'ELIMINATED';

      pill.className = `mini-player-pill ${isEliminated ? 'eliminated' : ''}`;
      pill.innerHTML = `
        <span class="mini-dot" style="background-color: ${p.color || '#6366F1'}"></span>
        <span>${escapeHtml(p.name)}</span>
        <span>${p.score || 0}⭐</span>
      `;
      this.dom.gameMiniRoster.appendChild(pill);
    });
  }

  handleAddPlayer() {
    const raw = this.dom.inputPlayerName ? this.dom.inputPlayerName.value.trim() : '';
    if (this.dom.addPlayerError) this.dom.addPlayerError.textContent = '';

    if (!raw) {
      if (this.dom.addPlayerError) this.dom.addPlayerError.textContent = 'Nama pemain tidak boleh kosong!';
      return;
    }
    if (raw.length > 16) {
      if (this.dom.addPlayerError) this.dom.addPlayerError.textContent = 'Nama pemain maksimal 16 karakter!';
      return;
    }
    if (this.players.some(p => p.name.toLowerCase() === raw.toLowerCase())) {
      if (this.dom.addPlayerError) this.dom.addPlayerError.textContent = 'Nama pemain sudah ada, gunakan nama lain!';
      return;
    }
    if (this.players.length >= 8) {
      if (this.dom.addPlayerError) this.dom.addPlayerError.textContent = 'Maksimal 8 pemain untuk mode pass-and-play!';
      return;
    }

    this.players.push({ id: `p_${Date.now()}`, name: raw });
    if (this.dom.inputPlayerName) this.dom.inputPlayerName.value = '';
    this.saveData();
    this.renderPlayerList();
    this.audio.playClick();
  }

  handleDeletePlayer(id) {
    if (this.players.length <= 2) {
      this.showToast('Minimal harus ada 2 pemain!');
      return;
    }
    this.players = this.players.filter(p => p.id !== id);
    this.saveData();
    this.renderPlayerList();
    this.audio.playClick();
  }

  handleEditPlayer(id) {
    const p = this.players.find(item => item.id === id);
    if (!p) return;

    const newName = prompt(`Ubah nama pemain "${p.name}":`, p.name);
    if (newName && newName.trim()) {
      const trimmed = newName.trim();
      if (this.players.some(other => other.id !== id && other.name.toLowerCase() === trimmed.toLowerCase())) {
        alert('Nama sudah digunakan!');
        return;
      }
      p.name = trimmed;
      this.saveData();
      this.renderPlayerList();
    }
  }

  isMyTurnNow() {
    if (this.gameSessionType === 'LOCAL') return true;
    if (this.network && this.network.role === 'HOST') {
      const active = this.engine ? this.engine.getCurrentPlayer() : null;
      return Boolean(active && active.id === this.myNetworkId);
    }
    return Boolean(this.currentTurnPlayer && this.currentTurnPlayer.id === this.myNetworkId);
  }

  shakeInput() {
    const target = this.dom.inputWrapper || this.dom.inputWord;
    if (target) {
      target.classList.remove('input-error-shake');
      void target.offsetWidth;
      target.classList.add('input-error-shake');
      setTimeout(() => {
        if (target) target.classList.remove('input-error-shake');
      }, 500);
    }
  }

  resolveSubmittedWord(raw, reqLetter) {
    if (!raw) return '';
    const clean = raw.trim().toLowerCase().replace(/[^a-z]/g, '');
    const req = (reqLetter || '').trim().toLowerCase();
    if (!req) return clean;

    if (clean.startsWith(req)) {
      return clean;
    }

    const validator = this.validator || (this.engine ? this.engine.validator : null);
    if (validator && validator.wordsSet) {
      const candidateWithPrefix = req + clean;
      if (validator.wordsSet.has(candidateWithPrefix)) {
        return candidateWithPrefix;
      }
      if (validator.wordsSet.has(clean)) {
        return clean;
      }
    }

    return req + clean;
  }

  handleSubmitWord() {
    if (!this.isMyTurnNow()) {
      this.showToast('⏳ Bukan giliranmu menjawab!');
      if (this.dom.inputWord) {
        this.dom.inputWord.readOnly = true;
        this.dom.inputWord.disabled = true;
        this.dom.inputWord.blur();
      }
      return;
    }

    const raw = (this.dom.inputWord ? this.dom.inputWord.value : '').trim();
    if (!raw) {
      this.showToast('⚠️ Ketik kata terlebih dahulu!');
      this.shakeInput();
      return;
    }

    const reqLetter = (this.engine && this.engine.requiredLetter)
      ? this.engine.requiredLetter
      : (this.dom.gameRequiredLetter ? this.dom.gameRequiredLetter.textContent : '');
    const resolvedWord = this.resolveSubmittedWord(raw, reqLetter);

    if (this.gameSessionType === 'NETWORK' && this.network.role === 'CLIENT' && this.clientUsedWords && this.clientUsedWords.has(resolvedWord)) {
      const msg = `Kata "${resolvedWord.toUpperCase()}" sudah pernah digunakan dalam game ini!`;
      this.audio.playError();
      this.setWordFeedback(msg, false);
      this.showToast(`❌ ${msg}`);
      this.shakeInput();
      if (this.dom.inputWord) this.dom.inputWord.select();
      return;
    }

    if (this.gameSessionType === 'LOCAL') {
      const res = this.engine.submitWord(resolvedWord);
      if (res.handled) {
        if (res.success) {
          if (this.dom.inputWord) this.dom.inputWord.blur();
        } else {
          this.audio.playError();
          this.setWordFeedback(res.message, false);
          this.showToast(`❌ ${res.message}`);
          this.shakeInput();
          if (this.dom.inputWord) this.dom.inputWord.select();
        }
      }
    } else if (this.gameSessionType === 'NETWORK') {
      if (this.network.role === 'HOST') {
        const res = this.engine.submitWord(resolvedWord);
        if (!res.success) {
          this.audio.playError();
          this.setWordFeedback(res.message, false);
          this.showToast(`❌ ${res.message}`);
          this.shakeInput();
          if (this.dom.inputWord) this.dom.inputWord.select();
        }
      } else {
        this.network.sendToHost('SUBMIT_WORD', { word: resolvedWord });
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new SambunginApp();
  app.init();
  window.sambungin = app;
});
