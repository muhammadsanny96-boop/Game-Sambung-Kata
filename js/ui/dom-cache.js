/**
 * SAMBUNGIN! — DOM Cache Module
 * Centralizes element selection and provides clean access to UI nodes.
 */

export class DomCache {
  constructor() {
    this.init();
  }

  init() {
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
    this.btnShareWa = document.getElementById('btn-share-wa');
    this.btnCopyLink = document.getElementById('btn-copy-link');
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

    // Gameplay Arena elements
    this.gameTurnBanner = document.getElementById('game-turn-banner');
    this.bannerMainText = document.getElementById('banner-main-text');
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
    this.inputWrapper = document.querySelector('.input-wrapper.with-prefix') || document.querySelector('.input-wrapper');
    this.inputPrefixBadge = document.getElementById('input-prefix-badge');
    this.inputPrefixLetter = document.getElementById('input-prefix-letter');
    this.inputWord = document.getElementById('input-word');
    this.btnSubmitWord = document.getElementById('btn-submit-word');
    this.wordFeedbackMsg = document.getElementById('word-feedback-msg');
    this.spectatorReactionBox = document.getElementById('spectator-reaction-box');
    this.spectatorStatusText = document.getElementById('spectator-status-text');
    this.floatingEmotesContainer = document.getElementById('floating-emotes-container');
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
    this.settingVibration = document.getElementById('setting-vibration');
    this.btnResetStorage = document.getElementById('btn-reset-storage');
    this.btnCloseSettings = document.getElementById('btn-close-settings');
    this.btnCloseSettingsBottom = document.getElementById('btn-close-settings-bottom');

    // How-to Modal elements
    this.btnCloseHowTo = document.getElementById('btn-close-how-to');
    this.btnCloseHowToBottom = document.getElementById('btn-close-how-to-bottom');

    // Toast Container
    this.toastContainer = document.getElementById('toast-container');
  }
}
