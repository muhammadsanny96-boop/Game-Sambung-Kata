/**
 * SAMBUNGIN! — Main Application Controller
 * Connects UI elements, views, audio, validator, game engine,
 * and WebRTC P2P multi-device networking.
 */

import { WordValidator } from './word-validator.js';
import { ChallengeSystem } from './challenges.js';
import { AudioController } from './audio.js';
import { GameEngine } from './game-engine.js';
import { NetworkManager } from './network.js';

class SambunginApp {
  constructor() {
    this.validator = new WordValidator();
    this.challenges = new ChallengeSystem();
    this.audio = new AudioController();
    this.engine = new GameEngine(this.validator, this.challenges, this.audio);
    this.network = new NetworkManager();

    // Mode Type: 'LOCAL' (1 Device Pass & Play) or 'NETWORK' (Multi-Device P2P)
    this.gameSessionType = 'LOCAL';
    this.myNetworkId = null;

    // Initial Local Player Roster (min 2 players)
    this.players = [
      { id: 'p1', name: 'Pemain 1' },
      { id: 'p2', name: 'Pemain 2' }
    ];

    // Multiplayer Roster (Host + Joined Clients)
    this.networkPlayers = [];

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

    this.confettiAnimationId = null;

    this.cacheDom();
    this.loadPersistedData();
    this.bindEvents();
    this.setupEngineHooks();
    this.setupNetworkHooks();
    this.renderPlayerList();
    this.updateSetupConfigUI();
  }

  async init() {
    await this.validator.loadDataset('data/words.json');
    console.log(`[SAMBUNGIN] Kamus siap. ${this.validator.wordsSet.size} kosakata aktif.`);
  }

  cacheDom() {
    // Screens
    this.screens = {
      home: document.getElementById('screen-home'),
      setup: document.getElementById('screen-setup'),
      multiChoice: document.getElementById('screen-multiplayer-choice'),
      lobbyHost: document.getElementById('screen-lobby-host'),
      lobbyClient: document.getElementById('screen-lobby-client'),
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

    // Canvas
    this.confettiCanvas = document.getElementById('confetti-canvas');

    // Home buttons
    this.btnStartSetup = document.getElementById('btn-start-setup');
    this.btnOpenMultiplayer = document.getElementById('btn-open-multiplayer');
    this.btnQuickRules = document.getElementById('btn-quick-rules');
    this.btnHomeSettings = document.getElementById('btn-home-settings');
    this.navBrandBtn = document.getElementById('nav-brand-btn');
    this.btnOpenHowTo = document.getElementById('btn-open-how-to');
    this.btnOpenSettings = document.getElementById('btn-open-settings');

    // Multiplayer Choice buttons
    this.btnBackMultiToHome = document.getElementById('btn-back-multi-to-home');
    this.btnChoiceCreateRoom = document.getElementById('btn-choice-create-room');
    this.btnChoiceJoinRoom = document.getElementById('btn-choice-join-room');

    // Host Lobby elements
    this.btnLeaveHostRoom = document.getElementById('btn-leave-host-room');
    this.hostRoomCodeDisplay = document.getElementById('host-room-code-display');
    this.btnCopyRoomCode = document.getElementById('btn-copy-room-code');
    this.hostPlayerCountBadge = document.getElementById('host-player-count-badge');
    this.hostLobbyPlayersList = document.getElementById('host-lobby-players-list');
    this.hostValidationMsg = document.getElementById('host-validation-msg');
    this.btnHostStartGame = document.getElementById('btn-host-start-game');

    // Client Lobby elements
    this.btnLeaveClientRoom = document.getElementById('btn-leave-client-room');
    this.clientConnectBox = document.getElementById('client-connect-box');
    this.formJoinRoom = document.getElementById('form-join-room');
    this.inputClientName = document.getElementById('input-client-name');
    this.inputClientRoomCode = document.getElementById('input-client-room-code');
    this.clientJoinError = document.getElementById('client-join-error');
    this.btnSubmitJoinRoom = document.getElementById('btn-submit-join-room');
    this.clientWaitingBox = document.getElementById('client-waiting-box');
    this.clientRoomTitle = document.getElementById('client-room-title');
    this.clientLobbyPlayersList = document.getElementById('client-lobby-players-list');

    // Pass & Play Setup screen elements
    this.btnBackToHome = document.getElementById('btn-back-to-home');
    this.formAddPlayer = document.getElementById('form-add-player');
    this.inputPlayerName = document.getElementById('input-player-name');
    this.playerListContainer = document.getElementById('player-list-container');
    this.playerCountBadge = document.getElementById('player-count-badge');
    this.addPlayerError = document.getElementById('add-player-error');
    this.livesSettingGroup = document.getElementById('lives-setting-group');
    this.setupValidationMsg = document.getElementById('setup-validation-msg');
    this.btnStartGame = document.getElementById('btn-start-game');

    // Ready screen elements
    this.readyPlayerAvatar = document.getElementById('ready-player-avatar');
    this.readyPlayerName = document.getElementById('ready-player-name');
    this.readyRequiredLetter = document.getElementById('ready-required-letter');
    this.readyChallengeDesc = document.getElementById('ready-challenge-desc');
    this.readyTimerDesc = document.getElementById('ready-timer-desc');
    this.btnReadyStart = document.getElementById('btn-ready-start');
    this.readyPromptInstruction = document.getElementById('ready-prompt-instruction');

    // Gameplay elements
    this.gameMultiTurnBanner = document.getElementById('game-multi-turn-banner');
    this.gameActivePlayerName = document.getElementById('game-active-player-name');
    this.gameTurnBadge = document.getElementById('game-turn-badge');
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

  bindEvents() {
    // 1. Home Navigation
    this.btnStartSetup.addEventListener('click', () => {
      this.audio.playClick();
      this.gameSessionType = 'LOCAL';
      this.showScreen('setup');
    });

    this.btnOpenMultiplayer.addEventListener('click', () => {
      this.audio.playClick();
      this.gameSessionType = 'NETWORK';
      this.showScreen('multiChoice');
    });

    this.btnBackMultiToHome.addEventListener('click', () => {
      this.audio.playClick();
      this.showScreen('home');
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

    // 2. Modals
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

    // 3. Settings Form
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
      if (confirm('Yakin ingin mereset data pemain dan setelan?')) {
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

    // 4. Pass & Play Player Setup
    this.formAddPlayer.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddPlayer();
    });

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

    this.btnStartGame.addEventListener('click', () => {
      this.handleStartGame();
    });

    // 5. Multiplayer (Host / Client) Room Management
    this.btnChoiceCreateRoom.addEventListener('click', () => {
      this.audio.playClick();
      this.handleCreateHostRoom();
    });

    this.btnChoiceJoinRoom.addEventListener('click', () => {
      this.audio.playClick();
      this.showScreen('lobbyClient');
      this.clientConnectBox.classList.remove('hidden');
      this.clientWaitingBox.classList.add('hidden');
    });

    this.btnCopyRoomCode.addEventListener('click', () => {
      if (this.network.roomCode) {
        navigator.clipboard.writeText(this.network.roomCode).then(() => {
          this.showToast(`Kode "${this.network.roomCode}" berhasil disalin!`);
        }).catch(() => {
          this.showToast(`Kode Room: ${this.network.roomCode}`);
        });
      }
    });

    this.btnLeaveHostRoom.addEventListener('click', () => {
      this.audio.playClick();
      this.network.disconnect();
      this.showScreen('home');
    });

    this.btnLeaveClientRoom.addEventListener('click', () => {
      this.audio.playClick();
      this.network.disconnect();
      this.showScreen('home');
    });

    // Host Config Selectors in Lobby
    document.querySelectorAll('.host-mode-selector .pill-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        this.audio.playClick();
        document.querySelectorAll('.host-mode-selector .pill-opt').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.setupConfig.mode = btn.dataset.mode;
      });
    });

    document.querySelectorAll('.host-timer-grid .chip-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        this.audio.playClick();
        document.querySelectorAll('.host-timer-grid .chip-opt').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.setupConfig.timer = parseInt(btn.dataset.timer, 10);
      });
    });

    document.querySelectorAll('.host-challenge-grid .chip-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        this.audio.playClick();
        document.querySelectorAll('.host-challenge-grid .chip-opt').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.setupConfig.challenge = btn.dataset.challenge;
      });
    });

    this.btnHostStartGame.addEventListener('click', () => {
      this.handleHostStartGame();
    });

    this.formJoinRoom.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleClientJoinRoom();
    });

    // 6. Ready Screen Button
    this.btnReadyStart.addEventListener('click', () => {
      this.audio.playClick();
      if (this.gameSessionType === 'LOCAL') {
        this.showScreen('game');
        this.engine.startActiveTurn();
      } else if (this.gameSessionType === 'NETWORK') {
        if (this.network.role === 'HOST') {
          this.showScreen('game');
          this.engine.startActiveTurn();
          this.network.broadcast('REMOTE_START_ACTIVE_TURN', {});
        } else {
          // Client sends signal to Host that they are ready to start
          this.network.sendToHost('CLIENT_READY_TO_START', {});
        }
      }
      setTimeout(() => {
        this.inputWord.value = '';
        this.inputWord.focus();
      }, 100);
    });

    // 7. Gameplay Input
    this.formSubmitWord.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmitWord();
    });

    this.btnUseLifeline.addEventListener('click', () => {
      this.audio.playClick();
      if (this.gameSessionType === 'LOCAL') {
        const used = this.engine.useLifeline();
        if (used) {
          this.showToast('Bantuan dipakai! Huruf wajib diubah.');
          this.updateGameArena();
        } else {
          this.showToast('Bantuan sudah habis!');
        }
      } else if (this.gameSessionType === 'NETWORK') {
        if (this.network.role === 'HOST') {
          const used = this.engine.useLifeline();
          if (used) {
            this.showToast('Bantuan dipakai! Huruf diubah.');
            this.updateGameArena();
            this.network.broadcast('REMOTE_ARENA_SYNC', {
              requiredLetter: this.engine.requiredLetter,
              lifelines: this.engine.getCurrentPlayer().lifelines
            });
          }
        } else {
          this.network.sendToHost('CLIENT_USE_LIFELINE', {});
        }
      }
    });

    this.btnPauseGame.addEventListener('click', () => {
      this.audio.playClick();
      if (this.gameSessionType === 'LOCAL') {
        this.engine.pauseGame();
        this.openModal('pause');
      } else {
        this.showToast('Jeda dinonaktifkan dalam mode multi-device online.');
      }
    });

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
      if (this.gameSessionType === 'NETWORK') {
        this.network.disconnect();
      }
      this.showScreen('home');
    });

    // 8. Results Screen
    this.btnPlayAgain.addEventListener('click', () => {
      this.audio.playClick();
      if (this.gameSessionType === 'LOCAL') {
        this.handleStartGame();
      } else if (this.gameSessionType === 'NETWORK' && this.network.role === 'HOST') {
        this.handleHostStartGame();
      }
    });

    this.btnBackToMenu.addEventListener('click', () => {
      this.audio.playClick();
      if (this.gameSessionType === 'NETWORK') {
        this.network.disconnect();
      }
      this.showScreen('home');
    });
  }

  setupEngineHooks() {
    this.engine.onTurnReady = (data) => {
      this.renderReadyScreen(data);
      this.showScreen('ready');

      if (this.gameSessionType === 'NETWORK' && this.network.role === 'HOST') {
        this.network.broadcast('REMOTE_TURN_READY', {
          player: data.player,
          requiredLetter: data.requiredLetter,
          prevWord: data.prevWord,
          challenge: data.challenge,
          turnDuration: data.turnDuration
        });
      }
    };

    this.engine.onTurnStart = (data) => {
      this.updateGameArena();
      this.renderMiniRoster();

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

      if (this.gameSessionType === 'NETWORK' && this.network.role === 'HOST') {
        this.network.broadcast('REMOTE_TICK', { seconds, fraction });
      }
    };

    this.engine.onWordAccepted = (data) => {
      this.setWordFeedback(`Benar! +${data.points} Poin`, true);
      this.renderWordHistory();
      this.renderMiniRoster();
      this.inputWord.value = '';

      if (this.gameSessionType === 'NETWORK' && this.network.role === 'HOST') {
        this.network.broadcast('REMOTE_WORD_ACCEPTED', {
          data,
          history: this.engine.wordHistory,
          players: this.engine.players
        });
      }
    };

    this.engine.onWordRejected = (data) => {
      this.setWordFeedback(data.reason, false);
      this.renderMiniRoster();

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
    // When a player joins Host's lobby
    this.network.onPlayerJoined = (playerObj) => {
      this.audio.playCorrect();
      this.showToast(`👋 ${playerObj.name} bergabung ke Room!`);
      this.renderHostLobbyPlayers();
      this.broadcastLobbyRoster();
    };

    // When a player leaves
    this.network.onPlayerLeft = (playerObj) => {
      this.showToast(`🚪 ${playerObj.name} keluar dari Room.`);
      this.renderHostLobbyPlayers();
      this.broadcastLobbyRoster();
    };

    // Handle messages received by Host or Client
    this.network.onMessage = (type, payload, senderPeerId) => {
      this.handleNetworkMessage(type, payload, senderPeerId);
    };

    this.network.onError = (err) => {
      console.warn('[NETWORK ERROR]', err);
      this.showToast(`Koneksi: ${err.message || err}`);
    };
  }

  handleNetworkMessage(type, payload, senderPeerId) {
    // HOST RECEIVES MESSAGES FROM CLIENT
    if (this.network.role === 'HOST') {
      if (type === 'SUBMIT_WORD') {
        const currentActive = this.engine.getCurrentPlayer();
        if (currentActive && currentActive.id === senderPeerId) {
          const res = this.engine.submitWord(payload.word);
          if (!res.success) {
            // Send error feedback directly back to client
            this.network.sendToHost('WORD_ERROR_FEEDBACK', { message: res.message });
          }
        }
      } else if (type === 'CLIENT_READY_TO_START') {
        const currentActive = this.engine.getCurrentPlayer();
        if (currentActive && currentActive.id === senderPeerId) {
          this.engine.startActiveTurn();
          this.network.broadcast('REMOTE_START_ACTIVE_TURN', {});
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
      }
    }

    // CLIENT RECEIVES MESSAGES FROM HOST
    if (this.network.role === 'CLIENT') {
      switch (type) {
        case 'LOBBY_ROSTER_UPDATE':
          this.renderClientLobbyPlayers(payload.players);
          break;

        case 'REMOTE_GAME_START':
          this.setupConfig = payload.config;
          this.showScreen('game');
          this.showToast('Game dimulai!');
          break;

        case 'REMOTE_TURN_READY':
          this.renderReadyScreen(payload);
          this.showScreen('ready');
          break;

        case 'REMOTE_TURN_START':
          this.handleClientTurnStart(payload);
          break;

        case 'REMOTE_START_ACTIVE_TURN':
          this.showScreen('game');
          break;

        case 'REMOTE_TICK':
          this.updateTimerDisplay(payload.seconds, payload.fraction);
          break;

        case 'REMOTE_WORD_ACCEPTED':
          this.audio.playCorrect();
          this.setWordFeedback(`Benar! +${payload.data.points} Poin`, true);
          this.renderClientWordHistory(payload.history);
          this.renderClientMiniRoster(payload.players);
          break;

        case 'REMOTE_WORD_REJECTED':
          this.audio.playError();
          this.setWordFeedback(payload.data.reason, false);
          this.renderClientMiniRoster(payload.players);
          if (payload.data.eliminated) {
            this.showToast(`💀 ${payload.data.player.name} Tereliminasi!`);
          }
          break;

        case 'REMOTE_ARENA_SYNC':
          this.gameRequiredLetter.textContent = payload.requiredLetter.toUpperCase();
          this.lifelineCount.textContent = payload.lifelines;
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

  /* ================= MULTIPLAYER HOST FLOW ================= */
  async handleCreateHostRoom() {
    const hostName = prompt('Ketik nama kamu sebagai Host:', 'Host') || 'Host';
    this.showScreen('lobbyHost');
    this.hostRoomCodeDisplay.textContent = '...';
    this.hostValidationMsg.textContent = 'Menghubungkan ke jaringan P2P...';

    try {
      const code = await this.network.createRoom(hostName);
      this.hostRoomCodeDisplay.textContent = code;
      this.myNetworkId = this.network.myPeerId;
      this.renderHostLobbyPlayers();
      this.showToast(`Room aktif! Bagikan kode ${code} ke teman.`);
    } catch (err) {
      alert(`Gagal membuat room: ${err.message}`);
      this.showScreen('multiChoice');
    }
  }

  renderHostLobbyPlayers() {
    const players = [
      { id: this.network.myPeerId, name: `${this.network.myName} (Host)` }
    ];

    this.network.clients.forEach(c => {
      players.push({ id: c.id, name: c.name });
    });

    this.hostLobbyPlayersList.innerHTML = '';
    this.hostPlayerCountBadge.textContent = `${players.length} Pemain`;

    players.forEach((p, idx) => {
      const row = document.createElement('div');
      row.className = 'lobby-player-pill';
      row.innerHTML = `
        <span style="font-weight: 700;">${idx + 1}. ${escapeHtml(p.name)}</span>
        <span class="lobby-player-role">${idx === 0 ? '👑 HOST' : 'READY ✅'}</span>
      `;
      this.hostLobbyPlayersList.appendChild(row);
    });

    if (players.length >= 2) {
      this.hostValidationMsg.textContent = 'Room siap! Klik tombol di bawah untuk mulai.';
      this.hostValidationMsg.style.color = 'var(--color-success)';
      this.btnHostStartGame.disabled = false;
    } else {
      this.hostValidationMsg.textContent = 'Tunggu minimal 1 teman bergabung...';
      this.hostValidationMsg.style.color = 'var(--color-warning)';
      this.btnHostStartGame.disabled = true;
    }
  }

  broadcastLobbyRoster() {
    const players = [
      { id: this.network.myPeerId, name: `${this.network.myName} (Host)` }
    ];
    this.network.clients.forEach(c => {
      players.push({ id: c.id, name: c.name });
    });

    this.network.broadcast('LOBBY_ROSTER_UPDATE', { players });
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

    this.engine.startNewGame(roster, {
      mode: this.setupConfig.mode,
      timerDuration: this.setupConfig.timer,
      initialLives: this.setupConfig.lives,
      challengeDifficulty: this.setupConfig.challenge
    });
  }

  /* ================= MULTIPLAYER CLIENT FLOW ================= */
  async handleClientJoinRoom() {
    const name = this.inputClientName.value.trim();
    const code = this.inputClientRoomCode.value.trim().toUpperCase();
    this.clientJoinError.textContent = '';

    if (!name) {
      this.clientJoinError.textContent = 'Nama kamu tidak boleh kosong!';
      return;
    }
    if (!code || code.length < 3) {
      this.clientJoinError.textContent = 'Masukkan kode room 4 karakter!';
      return;
    }

    this.btnSubmitJoinRoom.disabled = true;
    this.clientJoinError.textContent = 'Menghubungkan ke Host...';
    this.clientJoinError.style.color = 'var(--color-accent)';

    try {
      await this.network.joinRoom(code, name);
      this.myNetworkId = this.network.myPeerId;
      this.clientConnectBox.classList.add('hidden');
      this.clientWaitingBox.classList.remove('hidden');
      this.clientRoomTitle.textContent = `Room: ${code}`;
      this.showToast(`Berhasil masuk ke Room ${code}!`);
    } catch (err) {
      this.clientJoinError.textContent = err.message || 'Gagal terhubung ke room.';
      this.clientJoinError.style.color = 'var(--color-danger)';
      this.btnSubmitJoinRoom.disabled = false;
    }
  }

  renderClientLobbyPlayers(players) {
    this.clientLobbyPlayersList.innerHTML = '';
    players.forEach((p, idx) => {
      const row = document.createElement('div');
      row.className = 'lobby-player-pill';
      row.innerHTML = `
        <span style="font-weight: 700;">${idx + 1}. ${escapeHtml(p.name)}</span>
        <span class="lobby-player-role">${idx === 0 ? '👑 HOST' : 'TERHUBUNG'}</span>
      `;
      this.clientLobbyPlayersList.appendChild(row);
    });
  }

  handleClientTurnStart(payload) {
    this.showScreen('game');
    const { player, requiredLetter, prevWord, challenge, players } = payload;
    const isMyTurn = (player.id === this.myNetworkId);

    this.gameActivePlayerName.textContent = player.name;

    // Multi-Device Turn Banner
    if (isMyTurn) {
      this.gameMultiTurnBanner.className = 'turn-personal-prompt';
      this.gameMultiTurnBanner.textContent = '🔥 GILIRAN KAMU SEKARANG! KETIK JAWABANMU!';
      this.inputWord.disabled = false;
      this.inputWord.placeholder = 'Ketik jawaban kata...';
      this.btnSubmitWord.disabled = false;
      this.btnUseLifeline.disabled = false;
      setTimeout(() => this.inputWord.focus(), 150);
    } else {
      this.gameMultiTurnBanner.className = 'turn-spectator-prompt';
      this.gameMultiTurnBanner.textContent = `⏳ Menunggu giliran ${player.name} menjawab...`;
      this.inputWord.disabled = true;
      this.inputWord.placeholder = `Giliran ${player.name}...`;
      this.btnSubmitWord.disabled = true;
      this.btnUseLifeline.disabled = true;
    }

    // Previous word & required letter
    if (prevWord.length > 1) {
      const stem = prevWord.slice(0, -1);
      const last = prevWord.slice(-1);
      this.gamePrevWord.innerHTML = `<span class="prev-stem">${escapeHtml(stem.toUpperCase())}</span><span class="prev-last-char">${escapeHtml(last.toUpperCase())}</span>`;
    } else {
      this.gamePrevWord.innerHTML = `<span class="prev-last-char">${escapeHtml(prevWord.toUpperCase())}</span>`;
    }

    this.gameRequiredLetter.textContent = requiredLetter.toUpperCase();

    // Challenge Banner
    if (challenge) {
      this.gameChallengeBanner.classList.remove('hidden');
      this.challengeIcon.textContent = challenge.icon || '🎯';
      this.challengeTitle.textContent = challenge.title;
      this.challengeInstruction.textContent = challenge.instruction;
    } else {
      this.gameChallengeBanner.classList.add('hidden');
    }

    this.renderClientMiniRoster(players);
  }

  renderClientWordHistory(history) {
    this.historyCount.textContent = history.length;
    if (!history.length) {
      this.wordHistoryList.innerHTML = '<span class="history-empty">Belum ada kata terhubung</span>';
      return;
    }

    this.wordHistoryList.innerHTML = '';
    history.forEach((item, index) => {
      const chip = document.createElement('span');
      chip.className = `history-tag ${index === 0 ? 'latest' : ''}`;
      chip.textContent = `${item.word.toUpperCase()} (${item.player})`;
      this.wordHistoryList.appendChild(chip);
    });
  }

  renderClientMiniRoster(players) {
    this.gameMiniRoster.innerHTML = '';
    players.forEach(p => {
      const pill = document.createElement('div');
      const isEliminated = p.status === 'ELIMINATED';

      pill.className = `mini-player-pill ${isEliminated ? 'eliminated' : ''}`;
      pill.innerHTML = `
        <span class="mini-dot" style="background-color: ${p.color || '#6366F1'}"></span>
        <span>${escapeHtml(p.name)}</span>
        <span>${p.score || 0}⭐</span>
      `;
      this.gameMiniRoster.appendChild(pill);
    });
  }

  /* ================= PASS & PLAY LOGIC ================= */
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

    this.players.push({ id: `p_${Date.now()}`, name: raw });
    this.inputPlayerName.value = '';
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
          <button type="button" class="btn-icon-subtle btn-edit" title="Edit" data-id="${p.id}">✏️</button>
          <button type="button" class="btn-icon-subtle btn-delete" title="Hapus" data-id="${p.id}" ${this.players.length <= 2 ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : ''}>🗑️</button>
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

  /* ================= READY & GAMEPLAY ================= */
  renderReadyScreen(data) {
    const { player, requiredLetter, challenge, turnDuration } = data;

    this.readyPlayerAvatar.textContent = player.name.charAt(0).toUpperCase();
    this.readyPlayerAvatar.style.backgroundColor = player.color || '#6366F1';
    this.readyPlayerName.textContent = player.name;
    this.readyRequiredLetter.textContent = requiredLetter.toUpperCase();
    this.readyTimerDesc.textContent = `${turnDuration} Detik`;

    if (this.gameSessionType === 'NETWORK') {
      const isMyTurn = (player.id === this.myNetworkId);
      this.readyPromptInstruction.innerHTML = isMyTurn
        ? `🔥 Ini adalah <strong>giliran kamu</strong>! Tekan tombol di bawah untuk mulai menjawab.`
        : `⏳ Giliran <strong>${player.name}</strong>. Bersiaplah memperhatikan kata berikutnya!`;
    } else {
      this.readyPromptInstruction.innerHTML = `Pastikan perangkat sudah di tanganmu. Waktu <strong>TIDAK AKAN BERJALAN</strong> sebelum kamu menekan tombol di bawah!`;
    }

    if (challenge) {
      this.readyChallengeDesc.textContent = `${challenge.icon || '🎯'} ${challenge.title} — ${challenge.instruction}`;
      this.readyChallengeDesc.style.color = 'var(--color-pink)';
    } else {
      this.readyChallengeDesc.textContent = 'Standar (Tanpa Batasan Khusus)';
      this.readyChallengeDesc.style.color = 'var(--text-muted)';
    }
  }

  updateGameArena() {
    const player = this.engine.getCurrentPlayer();
    if (!player) return;

    this.gameActivePlayerName.textContent = player.name;

    if (this.engine.config.mode === 'freeplay') {
      this.gamePlayerLivesBadge.style.display = 'none';
    } else {
      this.gamePlayerLivesBadge.style.display = 'inline-flex';
      this.gamePlayerLivesVal.textContent = player.lives;
    }
    this.gamePlayerScoreVal.textContent = player.score;

    const challenge = this.engine.activeChallenge;
    if (challenge) {
      this.gameChallengeBanner.classList.remove('hidden');
      this.challengeIcon.textContent = challenge.icon || '🎯';
      this.challengeTitle.textContent = challenge.title;
      this.challengeInstruction.textContent = challenge.instruction;
    } else {
      this.gameChallengeBanner.classList.add('hidden');
    }

    const prev = this.engine.currentWord;
    if (prev.length > 1) {
      const stem = prev.slice(0, -1);
      const last = prev.slice(-1);
      this.gamePrevWord.innerHTML = `<span class="prev-stem">${escapeHtml(stem.toUpperCase())}</span><span class="prev-last-char">${escapeHtml(last.toUpperCase())}</span>`;
    } else {
      this.gamePrevWord.innerHTML = `<span class="prev-last-char">${escapeHtml(prev.toUpperCase())}</span>`;
    }

    this.gameRequiredLetter.textContent = this.engine.requiredLetter.toUpperCase();

    this.lifelineCount.textContent = player.lifelines;
    this.btnUseLifeline.disabled = (player.lifelines <= 0 && !(challenge && challenge.freeLifeline));

    this.wordFeedbackMsg.textContent = '';
    this.wordFeedbackMsg.className = 'word-feedback';
  }

  updateTimerDisplay(seconds, fraction) {
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
  }

  handleSubmitWord() {
    const raw = this.inputWord.value;

    if (this.gameSessionType === 'LOCAL') {
      const res = this.engine.submitWord(raw);
      if (res.handled) {
        if (res.success) {
          this.inputWord.blur();
        } else {
          this.setWordFeedback(res.message, false);
          this.inputWord.select();
        }
      }
    } else if (this.gameSessionType === 'NETWORK') {
      if (this.network.role === 'HOST') {
        const res = this.engine.submitWord(raw);
        if (!res.success) {
          this.setWordFeedback(res.message, false);
          this.inputWord.select();
        }
      } else {
        // Send word to Host for authoritative validation
        this.network.sendToHost('SUBMIT_WORD', { word: raw });
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

  showScreen(name) {
    if (this.confettiAnimationId) {
      cancelAnimationFrame(this.confettiAnimationId);
      this.confettiAnimationId = null;
      if (this.confettiCanvas) {
        const ctx = this.confettiCanvas.getContext('2d');
        ctx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
      }
    }

    Object.values(this.screens).forEach(scr => {
      if (scr) scr.classList.remove('active');
    });
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

  launchConfetti() {
    if (!this.confettiCanvas) return;
    const canvas = this.confettiCanvas;
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#FBBF24', '#F59E0B', '#6366F1', '#EC4899', '#10B981', '#38BDF8'];

    for (let i = 0; i < 90; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 3,
        r: Math.random() * 5 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.7) * 14,
        gravity: 0.25,
        alpha: 1,
        rotation: Math.random() * 360,
        vr: (Math.random() - 0.5) * 10
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      particles.forEach(p => {
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vr;
        p.alpha -= 0.008;

        if (p.alpha > 0) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 1.5);
          ctx.restore();
        }
      });

      if (alive) {
        this.confettiAnimationId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    render();
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

document.addEventListener('DOMContentLoaded', () => {
  const app = new SambunginApp();
  app.init();
  window.sambungin = app;
});
