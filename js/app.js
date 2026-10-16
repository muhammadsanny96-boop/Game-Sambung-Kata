/**
 * SAMBUNGIN! — Main Application Controller
 * Connects UI elements, views, audio, validator, and game engine.
 */

import { WordValidator } from './word-validator.js';
import { ChallengeSystem } from './challenges.js';
import { AudioController } from './audio.js';
import { GameEngine } from './game-engine.js';

class SambunginApp {
  constructor() {
    this.validator = new WordValidator();
    this.challenges = new ChallengeSystem();
    this.audio = new AudioController();
    this.engine = new GameEngine(this.validator, this.challenges, this.audio);

    // Initial Player Roster (min 2 players)
    this.players = [
      { id: 'p1', name: 'Pemain 1' },
      { id: 'p2', name: 'Pemain 2' }
    ];

    // Setup Config State
    this.setupConfig = {
      mode: 'lps',
      timer: 10,
      lives: 3,
      challenge: 'normal'
    };

    // User Preferences (Persisted in localStorage)
    this.prefs = {
      sound: true,
      volume: 80,
      animations: true
    };

    this.cacheDom();
    this.loadPersistedData();
    this.bindEvents();
    this.setupEngineHooks();
    this.renderPlayerList();
    this.updateSetupConfigUI();
  }

  async init() {
    // Load local words dataset
    await this.validator.loadDataset('data/words.json');
    console.log(`[SAMBUNGIN] Kamus lokal siap. Kosakata termuat: ${this.validator.wordsSet.size} kata.`);
  }

  cacheDom() {
    // Screens
    this.screens = {
      home: document.getElementById('screen-home'),
      setup: document.getElementById('screen-setup'),
      ready: document.getElementById('screen-ready'),
      game: document.getElementById('screen-game'),
      results: document.getElementById('screen-results')
    };

    // Modals
    this.modals = {
      howTo: document.getElementById('modal-how-to'),
      settings: document.getElementById('modal-settings'),
      pause: document.getElementById('modal-pause')
    };

    // Home buttons
    this.btnStartSetup = document.getElementById('btn-start-setup');
    this.btnQuickRules = document.getElementById('btn-quick-rules');
    this.btnHomeSettings = document.getElementById('btn-home-settings');
    this.navBrandBtn = document.getElementById('nav-brand-btn');
    this.btnOpenHowTo = document.getElementById('btn-open-how-to');
    this.btnOpenSettings = document.getElementById('btn-open-settings');

    // Setup screen elements
    this.btnBackToHome = document.getElementById('btn-back-to-home');
    this.formAddPlayer = document.getElementById('form-add-player');
    this.inputPlayerName = document.getElementById('input-player-name');
    this.playerListContainer = document.getElementById('player-list-container');
    this.playerCountBadge = document.getElementById('player-count-badge');
    this.addPlayerError = document.getElementById('add-player-error');
    this.livesSettingGroup = document.getElementById('lives-setting-group');
    this.setupValidationMsg = document.getElementById('setup-validation-msg');
    this.btnStartGame = document.getElementById('btn-start-game');

    // Ready screen elements (Turn handoff)
    this.readyPlayerAvatar = document.getElementById('ready-player-avatar');
    this.readyPlayerName = document.getElementById('ready-player-name');
    this.readyRequiredLetter = document.getElementById('ready-required-letter');
    this.readyChallengeDesc = document.getElementById('ready-challenge-desc');
    this.readyTimerDesc = document.getElementById('ready-timer-desc');
    this.btnReadyStart = document.getElementById('btn-ready-start');

    // Gameplay elements
    this.gameActivePlayerName = document.getElementById('game-active-player-name');
    this.gamePlayerLivesBadge = document.getElementById('game-player-lives-badge');
    this.gamePlayerLivesVal = document.getElementById('game-player-lives-val');
    this.gamePlayerScoreBadge = document.getElementById('game-player-score-badge');
    this.gamePlayerScoreVal = document.getElementById('game-player-score-val');
    this.btnPauseGame = document.getElementById('btn-pause-game');
    this.gameChallengeBanner = document.getElementById('game-challenge-banner');
    this.challengeIcon = document.getElementById('challenge-icon');
    this.challengeTitle = document.getElementById('challenge-title');
    this.challengeInstruction = document.getElementById('challenge-instruction');
    this.timerCircle = document.getElementById('timer-circle');
    this.timerSeconds = document.getElementById('timer-seconds');
    this.timerProgressBar = document.getElementById('timer-progress-bar');
    this.gamePrevWord = document.getElementById('game-prev-word');
    this.gameRequiredLetter = document.getElementById('game-required-letter');
    this.formSubmitWord = document.getElementById('form-submit-word');
    this.inputWord = document.getElementById('input-word');
    this.btnSubmitWord = document.getElementById('btn-submit-word');
    this.wordFeedbackMsg = document.getElementById('word-feedback-msg');
    this.btnUseLifeline = document.getElementById('btn-use-lifeline');
    this.lifelineCount = document.getElementById('lifeline-count');
    this.wordHistoryList = document.getElementById('word-history-list');
    this.historyCount = document.getElementById('history-count');
    this.gameMiniRoster = document.getElementById('game-mini-roster');

    // Results screen elements
    this.resultsModeDesc = document.getElementById('results-mode-desc');
    this.resultsWinnerAvatar = document.getElementById('results-winner-avatar');
    this.resultsWinnerName = document.getElementById('results-winner-name');
    this.resultsWinnerLabel = document.getElementById('results-winner-label');
    this.resultsLeaderboardList = document.getElementById('results-leaderboard-list');
    this.statTotalWords = document.getElementById('stat-total-words');
    this.statLongestWord = document.getElementById('stat-longest-word');
    this.statRoundsCount = document.getElementById('stat-rounds-count');
    this.btnPlayAgain = document.getElementById('btn-play-again');
    this.btnBackToMenu = document.getElementById('btn-back-to-menu');

    // Pause Modal buttons
    this.btnResumeGame = document.getElementById('btn-resume-game');
    this.btnRestartGame = document.getElementById('btn-restart-game');
    this.btnQuitToHome = document.getElementById('btn-quit-to-home');

    // Settings Modal elements
    this.settingSound = document.getElementById('setting-sound');
    this.settingVolume = document.getElementById('setting-volume');
    this.settingAnimations = document.getElementById('setting-animations');
    this.btnResetStorage = document.getElementById('btn-reset-storage');
    this.btnCloseSettings = document.getElementById('btn-close-settings');
    this.btnCloseSettingsBottom = document.getElementById('btn-close-settings-bottom');

    // How-to Modal elements
    this.btnCloseHowTo = document.getElementById('btn-close-how-to');
    this.btnCloseHowToBottom = document.getElementById('btn-close-how-to-bottom');

    // Toast Container
    this.toastContainer = document.getElementById('toast-container');
  }

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

      // Apply prefs
      this.settingSound.checked = this.prefs.sound;
      this.audio.setEnabled(this.prefs.sound);

      this.settingVolume.value = this.prefs.volume;
      this.audio.setVolume(this.prefs.volume);

      this.settingAnimations.checked = this.prefs.animations;
    } catch (e) {
      console.warn('LocalStorage not accessible or empty:', e);
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

  bindEvents() {
    // Navigation & Screen switching
    this.btnStartSetup.addEventListener('click', () => {
      this.audio.playClick();
      this.showScreen('setup');
    });

    this.btnBackToHome.addEventListener('click', () => {
      this.audio.playClick();
      this.showScreen('home');
    });

    this.navBrandBtn.addEventListener('click', () => {
      if (this.engine.state === 'PLAYING') {
        this.openModal('pause');
      } else {
        this.audio.playClick();
        this.showScreen('home');
      }
    });

    // Modals
    this.btnQuickRules.addEventListener('click', () => {
      this.audio.playClick();
      this.openModal('howTo');
    });
    this.btnOpenHowTo.addEventListener('click', () => {
      this.audio.playClick();
      this.openModal('howTo');
    });
    this.btnCloseHowTo.addEventListener('click', () => this.closeModal('howTo'));
    this.btnCloseHowToBottom.addEventListener('click', () => this.closeModal('howTo'));

    this.btnHomeSettings.addEventListener('click', () => {
      this.audio.playClick();
      this.openModal('settings');
    });
    this.btnOpenSettings.addEventListener('click', () => {
      this.audio.playClick();
      this.openModal('settings');
    });
    this.btnCloseSettings.addEventListener('click', () => this.closeModal('settings'));
    this.btnCloseSettingsBottom.addEventListener('click', () => this.closeModal('settings'));

    // Settings inputs
    this.settingSound.addEventListener('change', (e) => {
      this.prefs.sound = e.target.checked;
      this.audio.setEnabled(this.prefs.sound);
      this.saveData();
    });

    this.settingVolume.addEventListener('input', (e) => {
      this.prefs.volume = parseInt(e.target.value, 10);
      this.audio.setVolume(this.prefs.volume);
      this.saveData();
    });

    this.settingAnimations.addEventListener('change', (e) => {
      this.prefs.animations = e.target.checked;
      this.saveData();
    });

    this.btnResetStorage.addEventListener('click', () => {
      if (confirm('Yakin ingin mereset daftar pemain dan setelan?')) {
        localStorage.clear();
        this.players = [
          { id: 'p1', name: 'Pemain 1' },
          { id: 'p2', name: 'Pemain 2' }
        ];
        this.renderPlayerList();
        this.showToast('Data berhasil direset.');
        this.closeModal('settings');
      }
    });

    // Setup Screen: Player Add
    this.formAddPlayer.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddPlayer();
    });

    // Setup Screen: Config Options Selectors
    document.querySelectorAll('.mode-selector .pill-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        this.audio.playClick();
        document.querySelectorAll('.mode-selector .pill-opt').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-checked', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-checked', 'true');
        this.setupConfig.mode = btn.dataset.mode;
        this.livesSettingGroup.style.display = (this.setupConfig.mode === 'lps') ? 'block' : 'none';
      });
    });

    document.querySelectorAll('.timer-grid .chip-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        this.audio.playClick();
        document.querySelectorAll('.timer-grid .chip-opt').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.setupConfig.timer = parseInt(btn.dataset.timer, 10);
      });
    });

    document.querySelectorAll('.lives-grid .chip-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        this.audio.playClick();
        document.querySelectorAll('.lives-grid .chip-opt').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.setupConfig.lives = parseInt(btn.dataset.lives, 10);
      });
    });

    document.querySelectorAll('.challenge-grid .chip-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        this.audio.playClick();
        document.querySelectorAll('.challenge-grid .chip-opt').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.setupConfig.challenge = btn.dataset.challenge;
      });
    });

    // Start Game from Setup
    this.btnStartGame.addEventListener('click', () => {
      this.handleStartGame();
    });

    // READY SCREEN: Start Turn Button (Requested Turn Handoff Feature!)
    this.btnReadyStart.addEventListener('click', () => {
      this.audio.playClick();
      this.showScreen('game');
      this.engine.startActiveTurn();
      setTimeout(() => {
        this.inputWord.value = '';
        this.inputWord.focus();
      }, 100);
    });

    // Gameplay: Word Submission
    this.formSubmitWord.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmitWord();
    });

    // Gameplay: Lifeline
    this.btnUseLifeline.addEventListener('click', () => {
      this.audio.playClick();
      const used = this.engine.useLifeline();
      if (used) {
        this.showToast('Bantuan dipakai! Huruf wajib diubah.');
        this.updateGameArena();
      } else {
        this.showToast('Bantuan sudah habis atau tidak tersedia!');
      }
    });

    // Gameplay: Pause Game
    this.btnPauseGame.addEventListener('click', () => {
      this.audio.playClick();
      this.engine.pauseGame();
      this.openModal('pause');
    });

    // Pause Modal Controls
    this.btnResumeGame.addEventListener('click', () => {
      this.audio.playClick();
      this.closeModal('pause');
      this.engine.resumeGame();
    });

    this.btnRestartGame.addEventListener('click', () => {
      this.audio.playClick();
      this.closeModal('pause');
      this.handleStartGame();
    });

    this.btnQuitToHome.addEventListener('click', () => {
      this.audio.playClick();
      this.engine.stopTimer();
      this.closeModal('pause');
      this.showScreen('home');
    });

    // Results Screen Controls
    this.btnPlayAgain.addEventListener('click', () => {
      this.audio.playClick();
      this.handleStartGame();
    });

    this.btnBackToMenu.addEventListener('click', () => {
      this.audio.playClick();
      this.showScreen('home');
    });
  }

  setupEngineHooks() {
    // When turn is ready for a player (handoff interstitial)
    this.engine.onTurnReady = (data) => {
      this.renderReadyScreen(data);
      this.showScreen('ready');
    };

    // When player clicks "MULAI GILIRAN SEKARANG"
    this.engine.onTurnStart = (data) => {
      this.updateGameArena();
      this.renderMiniRoster();
    };

    // Timer tick callback
    this.engine.onTick = (seconds, fraction) => {
      this.timerSeconds.textContent = seconds;
      this.timerProgressBar.style.width = `${Math.max(0, fraction * 100)}%`;

      if (seconds <= 3) {
        this.timerCircle.classList.add('timer-critical');
        this.timerProgressBar.classList.add('progress-critical');
        this.audio.playTick(true);
      } else {
        this.timerCircle.classList.remove('timer-critical');
        this.timerProgressBar.classList.remove('progress-critical');
        if (seconds <= 5) {
          this.audio.playTick(false);
        }
      }
    };

    // Word accepted callback
    this.engine.onWordAccepted = (data) => {
      this.setWordFeedback(`Benar! +${data.points} Poin`, true);
      this.renderWordHistory();
      this.renderMiniRoster();
      this.inputWord.value = '';
    };

    // Word rejected / timeout callback
    this.engine.onWordRejected = (data) => {
      this.setWordFeedback(data.reason, false);
      this.renderMiniRoster();
      if (data.eliminated) {
        this.showToast(`💀 ${data.player.name} Tereliminasi!`);
      }
    };

    // Player eliminated callback
    this.engine.onPlayerEliminated = (player) => {
      this.showToast(`Pemain ${player.name} telah kehabisan nyawa!`);
    };

    // Game over callback
    this.engine.onGameOver = (summary) => {
      this.renderResultsScreen(summary);
      this.showScreen('results');
    };
  }

  showScreen(name) {
    Object.values(this.screens).forEach(scr => scr.classList.remove('active'));
    if (this.screens[name]) {
      this.screens[name].classList.add('active');
    }
  }

  openModal(name) {
    if (this.modals[name]) {
      this.modals[name].classList.remove('hidden');
    }
  }

  closeModal(name) {
    if (this.modals[name]) {
      this.modals[name].classList.add('hidden');
    }
  }

  showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    this.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 2500);
  }

  /* ================= PLAYER SETUP LOGIC ================= */
  handleAddPlayer() {
    const raw = this.inputPlayerName.value.trim();
    this.addPlayerError.textContent = '';

    if (!raw) {
      this.addPlayerError.textContent = 'Nama pemain tidak boleh kosong!';
      return;
    }

    if (raw.length > 16) {
      this.addPlayerError.textContent = 'Nama pemain maksimal 16 karakter!';
      return;
    }

    if (this.players.some(p => p.name.toLowerCase() === raw.toLowerCase())) {
      this.addPlayerError.textContent = 'Nama pemain sudah ada, gunakan nama lain!';
      return;
    }

    if (this.players.length >= 8) {
      this.addPlayerError.textContent = 'Maksimal 8 pemain untuk mode pass-and-play!';
      return;
    }

    const newPlayer = {
      id: `p_${Date.now()}`,
      name: raw
    };

    this.players.push(newPlayer);
    this.inputPlayerName.value = '';
    this.saveData();
    this.renderPlayerList();
    this.audio.playClick();
  }

  handleDeletePlayer(id) {
    if (this.players.length <= 2) {
      this.showToast('Minimal harus ada 2 pemain untuk bermain!');
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
        alert('Nama sudah digunakan pemain lain!');
        return;
      }
      p.name = trimmed;
      this.saveData();
      this.renderPlayerList();
    }
  }

  renderPlayerList() {
    this.playerListContainer.innerHTML = '';
    this.playerCountBadge.textContent = `${this.players.length} Pemain`;

    const avatarColors = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#EF4444', '#3B82F6'];

    this.players.forEach((p, index) => {
      const row = document.createElement('div');
      row.className = 'player-item-row';

      const initial = p.name.charAt(0).toUpperCase();
      const color = avatarColors[index % avatarColors.length];

      row.innerHTML = `
        <div class="player-identity">
          <div class="player-avatar-badge" style="background-color: ${color}">${initial}</div>
          <span class="player-name-text">${escapeHtml(p.name)}</span>
        </div>
        <div class="player-row-actions">
          <button type="button" class="btn-icon-subtle btn-edit" title="Edit Nama" data-id="${p.id}">
            ✏️
          </button>
          <button type="button" class="btn-icon-subtle btn-delete" title="Hapus" data-id="${p.id}" ${this.players.length <= 2 ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : ''}>
            🗑️
          </button>
        </div>
      `;

      row.querySelector('.btn-edit').addEventListener('click', () => this.handleEditPlayer(p.id));
      const delBtn = row.querySelector('.btn-delete');
      if (this.players.length > 2) {
        delBtn.addEventListener('click', () => this.handleDeletePlayer(p.id));
      }

      this.playerListContainer.appendChild(row);
    });

    this.validateSetupState();
  }

  validateSetupState() {
    if (this.players.length < 2) {
      this.setupValidationMsg.textContent = 'Minimal harus 2 pemain untuk memulai!';
      this.btnStartGame.disabled = true;
      return false;
    }
    this.setupValidationMsg.textContent = '';
    this.btnStartGame.disabled = false;
    return true;
  }

  updateSetupConfigUI() {
    this.livesSettingGroup.style.display = (this.setupConfig.mode === 'lps') ? 'block' : 'none';
  }

  /* ================= START GAME ================= */
  handleStartGame() {
    if (!this.validateSetupState()) return;

    this.audio.playClick();
    this.engine.startNewGame(this.players, {
      mode: this.setupConfig.mode,
      timerDuration: this.setupConfig.timer,
      initialLives: this.setupConfig.lives,
      challengeDifficulty: this.setupConfig.challenge
    });
  }

  /* ================= READY / TURN HANDOFF ================= */
  renderReadyScreen(data) {
    const { player, requiredLetter, challenge, turnDuration } = data;

    this.readyPlayerAvatar.textContent = player.name.charAt(0).toUpperCase();
    this.readyPlayerAvatar.style.backgroundColor = player.color;
    this.readyPlayerName.textContent = player.name;
    this.readyRequiredLetter.textContent = requiredLetter.toUpperCase();
    this.readyTimerDesc.textContent = `${turnDuration} Detik`;

    if (challenge) {
      this.readyChallengeDesc.textContent = `${challenge.icon || '🎯'} ${challenge.title} — ${challenge.instruction}`;
      this.readyChallengeDesc.style.color = 'var(--color-pink)';
    } else {
      this.readyChallengeDesc.textContent = 'Standar (Tanpa Batasan Khusus)';
      this.readyChallengeDesc.style.color = 'var(--text-muted)';
    }
  }

  /* ================= GAMEPLAY ARENA ================= */
  updateGameArena() {
    const player = this.engine.getCurrentPlayer();
    if (!player) return;

    this.gameActivePlayerName.textContent = player.name;

    // Lives & Score display
    if (this.engine.config.mode === 'freeplay') {
      this.gamePlayerLivesBadge.style.display = 'none';
    } else {
      this.gamePlayerLivesBadge.style.display = 'inline-flex';
      this.gamePlayerLivesVal.textContent = player.lives;
    }
    this.gamePlayerScoreVal.textContent = player.score;

    // Challenge Banner
    const challenge = this.engine.activeChallenge;
    if (challenge) {
      this.gameChallengeBanner.classList.remove('hidden');
      this.challengeIcon.textContent = challenge.icon || '🎯';
      this.challengeTitle.textContent = challenge.title;
      this.challengeInstruction.textContent = challenge.instruction;
    } else {
      this.gameChallengeBanner.classList.add('hidden');
    }

    // Previous word & required letter
    const prev = this.engine.currentWord;
    if (prev.length > 1) {
      const stem = prev.slice(0, -1);
      const last = prev.slice(-1);
      this.gamePrevWord.innerHTML = `<span class="prev-stem">${escapeHtml(stem.toUpperCase())}</span><span class="prev-last-char">${escapeHtml(last.toUpperCase())}</span>`;
    } else {
      this.gamePrevWord.innerHTML = `<span class="prev-last-char">${escapeHtml(prev.toUpperCase())}</span>`;
    }

    this.gameRequiredLetter.textContent = this.engine.requiredLetter.toUpperCase();

    // Lifeline button
    this.lifelineCount.textContent = player.lifelines;
    this.btnUseLifeline.disabled = (player.lifelines <= 0 && !(challenge && challenge.freeLifeline));

    // Reset feedback
    this.wordFeedbackMsg.textContent = '';
    this.wordFeedbackMsg.className = 'word-feedback';
  }

  handleSubmitWord() {
    const raw = this.inputWord.value;
    const res = this.engine.submitWord(raw);

    if (res.handled) {
      if (res.success) {
        this.inputWord.blur();
      } else {
        this.setWordFeedback(res.message, false);
        this.inputWord.select();
      }
    }
  }

  setWordFeedback(msg, isSuccess) {
    this.wordFeedbackMsg.textContent = msg;
    this.wordFeedbackMsg.className = isSuccess
      ? 'word-feedback feedback-success'
      : 'word-feedback feedback-error';
  }

  renderWordHistory() {
    this.historyCount.textContent = this.engine.wordHistory.length;
    if (!this.engine.wordHistory.length) {
      this.wordHistoryList.innerHTML = '<span class="history-empty">Belum ada kata terhubung</span>';
      return;
    }

    this.wordHistoryList.innerHTML = '';
    this.engine.wordHistory.forEach((item, index) => {
      const chip = document.createElement('span');
      chip.className = `history-tag ${index === 0 ? 'latest' : ''}`;
      chip.textContent = `${item.word.toUpperCase()} (${item.player})`;
      this.wordHistoryList.appendChild(chip);
    });
  }

  renderMiniRoster() {
    this.gameMiniRoster.innerHTML = '';
    const current = this.engine.getCurrentPlayer();

    this.engine.players.forEach(p => {
      const pill = document.createElement('div');
      const isActive = current && current.id === p.id;
      const isEliminated = p.status === 'ELIMINATED';

      pill.className = `mini-player-pill ${isActive ? 'active' : ''} ${isEliminated ? 'eliminated' : ''}`;
      pill.innerHTML = `
        <span class="mini-dot" style="background-color: ${p.color}"></span>
        <span>${escapeHtml(p.name)}</span>
        <span>${this.engine.config.mode === 'freeplay' ? `${p.score}⭐` : `${p.lives}❤️`}</span>
      `;
      this.gameMiniRoster.appendChild(pill);
    });
  }

  /* ================= RESULTS SCREEN ================= */
  renderResultsScreen(summary) {
    const { winner, players, totalWords, roundsPlayed, longestWord } = summary;

    const modeLabels = {
      lps: 'Mode Last Player Standing',
      freeplay: 'Mode Free Play (Skor Terbanyak)',
      suddendeath: 'Mode Sudden Death'
    };
    this.resultsModeDesc.textContent = modeLabels[this.engine.config.mode] || 'Hasil Sesi Permainan';

    if (winner) {
      this.resultsWinnerAvatar.textContent = '👑';
      this.resultsWinnerName.textContent = winner.name;
      this.resultsWinnerLabel.textContent = this.engine.config.mode === 'freeplay'
        ? `JUARA DENGAN ${winner.score} POIN!`
        : 'JUARA BERTAHAN TERAKHIR!';
    } else {
      this.resultsWinnerAvatar.textContent = '🤝';
      this.resultsWinnerName.textContent = 'Hasil Seri';
      this.resultsWinnerLabel.textContent = 'Semua pemain gugur bersamaan!';
    }

    // Leaderboard
    this.resultsLeaderboardList.innerHTML = '';
    players.forEach((p, idx) => {
      const item = document.createElement('div');
      item.className = `leaderboard-item ${idx === 0 ? 'rank-1' : ''}`;
      item.innerHTML = `
        <span>#${idx + 1} <strong>${escapeHtml(p.name)}</strong></span>
        <span>${p.score} Poin (${p.status === 'ELIMINATED' ? 'Gugur' : 'Bertahan'})</span>
      `;
      this.resultsLeaderboardList.appendChild(item);
    });

    this.statTotalWords.textContent = totalWords;
    this.statLongestWord.textContent = longestWord;
    this.statRoundsCount.textContent = roundsPlayed;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Bootstrap Application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new SambunginApp();
  app.init();
  window.sambungin = app; // Expose to window for testing / debugging
});
