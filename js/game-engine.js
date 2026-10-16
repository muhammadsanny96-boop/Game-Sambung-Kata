/**
 * SAMBUNGIN! — Core Game Engine
 * Manages game state, single-timer lifecycle, pass-and-play turn handoff,
 * seamless auto-turn for multiplayer, scoring, lives, and player elimination.
 */

export class GameEngine {
  constructor(wordValidator, challengeSystem, audioController) {
    this.validator = wordValidator;
    this.challenges = challengeSystem;
    this.audio = audioController;

    // Configurable Game Settings
    this.config = {
      mode: 'lps',           // 'lps' (Last Player Standing), 'freeplay', 'suddendeath'
      timerDuration: 10,     // 5, 10, 15, 20
      initialLives: 3,       // 1, 3, 5
      challengeDifficulty: 'normal', // 'off', 'casual', 'normal', 'chaos'
      freePlayMaxRounds: 20,
      autoStartTurn: false   // If true (Multi-device), turns start immediately without 'Ready' pause!
    };

    // State Variables
    this.state = 'IDLE'; // 'IDLE', 'SETUP', 'READY', 'PLAYING', 'PAUSED', 'GAME_OVER'
    this.players = [];   // Array of { id, name, lives, score, status, lifelines, color }
    this.currentPlayerIndex = 0;
    this.currentWord = '';
    this.requiredLetter = '';
    this.usedWords = new Set();
    this.wordHistory = [];
    this.activeChallenge = null;

    // Turn & Timer Management
    this.remainingTime = 10;
    this.turnDuration = 10;
    this.timerInterval = null;
    this.isProcessingTurn = false; // Lock against race conditions between submit and timeout
    this.totalRoundsPlayed = 0;
    this.winner = null;

    // Callbacks for UI updates
    this.onStateChange = null;
    this.onTick = null;
    this.onTurnReady = null;      // Called when device should be handed over (Pass & Play)
    this.onTurnStart = null;      // Called when turn starts actively (Auto or Manual)
    this.onWordAccepted = null;
    this.onWordRejected = null;
    this.onPlayerEliminated = null;
    this.onGameOver = null;
  }

  /**
   * Initializes a new game session with given players and settings.
   */
  startNewGame(playersList, customConfig = {}) {
    this.config = { ...this.config, ...customConfig };
    this.stopTimer();

    const avatarColors = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#EF4444', '#3B82F6'];

    this.players = playersList.map((p, idx) => ({
      id: p.id || `p_${idx + 1}`,
      name: p.name.trim(),
      lives: this.config.mode === 'suddendeath' ? 1 : (this.config.mode === 'lps' ? this.config.initialLives : 99),
      score: 0,
      status: 'ACTIVE', // 'ACTIVE', 'ELIMINATED'
      lifelines: 1,     // 1 free assist per game
      color: avatarColors[idx % avatarColors.length]
    }));

    this.currentPlayerIndex = 0;
    this.usedWords.clear();
    this.wordHistory = [];
    this.totalRoundsPlayed = 0;
    this.winner = null;
    this.isProcessingTurn = false;

    // Pick first starter word
    this.currentWord = this.validator.getRandomStartingWord();
    this.usedWords.add(this.validator.normalize(this.currentWord));
    this.requiredLetter = this.validator.getLastLetter(this.currentWord);

    // Prepare first turn
    this.prepareTurn();
  }

  /**
   * Prepares the turn.
   * If autoStartTurn is true (Multiplayer), automatically starts turn countdown!
   * If autoStartTurn is false (Pass & Play), pauses in READY state for device handoff.
   */
  prepareTurn() {
    this.stopTimer();
    this.isProcessingTurn = false;

    // Ensure we are pointing to an ACTIVE player
    const activePlayers = this.getActivePlayers();
    if (activePlayers.length <= 1 && (this.config.mode === 'lps' || this.config.mode === 'suddendeath')) {
      this.checkGameOver();
      return;
    }

    if (this.players[this.currentPlayerIndex].status === 'ELIMINATED') {
      let nextIndex = (this.currentPlayerIndex + 1) % this.players.length;
      let loops = 0;
      while (this.players[nextIndex].status === 'ELIMINATED' && loops < this.players.length) {
        nextIndex = (nextIndex + 1) % this.players.length;
        loops++;
      }
      this.currentPlayerIndex = nextIndex;
    }

    const player = this.getCurrentPlayer();
    if (!player || player.status === 'ELIMINATED') {
      this.checkGameOver();
      return;
    }

    // Determine turn duration & roll challenge
    this.turnDuration = this.config.timerDuration;
    this.activeChallenge = this.challenges.rollChallenge(
      this.config.challengeDifficulty,
      this.config.mode,
      this.requiredLetter
    );

    if (this.activeChallenge && this.activeChallenge.overrideTimer) {
      this.turnDuration = this.activeChallenge.overrideTimer;
    }

    this.remainingTime = this.turnDuration;

    // MULTIPLAYER AUTO-TURN LOGIC:
    // If autoStartTurn is enabled, do NOT pause for ready button — start active turn immediately!
    if (this.config.autoStartTurn) {
      this.state = 'PLAYING';
      this.startTimer();
      if (this.onTurnStart) {
        this.onTurnStart({
          player,
          remainingTime: this.remainingTime,
          turnDuration: this.turnDuration,
          requiredLetter: this.requiredLetter,
          prevWord: this.currentWord,
          challenge: this.activeChallenge,
          isAutoTurn: true
        });
      }
    } else {
      // Pass & Play Mode: Wait in READY state until button clicked
      this.state = 'READY';
      if (this.onTurnReady) {
        this.onTurnReady({
          player,
          requiredLetter: this.requiredLetter,
          prevWord: this.currentWord,
          challenge: this.activeChallenge,
          turnDuration: this.turnDuration
        });
      }
    }
  }

  /**
   * Called manually when player presses "MULAI GILIRAN" (in Pass & Play mode).
   */
  startActiveTurn() {
    if (this.state !== 'READY') return;

    this.state = 'PLAYING';
    this.isProcessingTurn = false;
    this.startTimer();

    if (this.onTurnStart) {
      this.onTurnStart({
        player: this.getCurrentPlayer(),
        remainingTime: this.remainingTime,
        turnDuration: this.turnDuration,
        requiredLetter: this.requiredLetter,
        prevWord: this.currentWord,
        challenge: this.activeChallenge,
        isAutoTurn: false
      });
    }
  }

  /**
   * Starts single countdown timer with precision delta timing.
   */
  startTimer() {
    this.stopTimer();
    let lastTimestamp = Date.now();

    this.timerInterval = setInterval(() => {
      if (this.state !== 'PLAYING') {
        this.stopTimer();
        return;
      }

      const now = Date.now();
      const delta = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      this.remainingTime -= delta;

      if (this.remainingTime <= 0) {
        this.remainingTime = 0;
        this.stopTimer();
        this.handleTimeout();
      } else {
        if (this.onTick) {
          this.onTick(Math.ceil(this.remainingTime), this.remainingTime / this.turnDuration);
        }
      }
    }, 100);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  pauseGame() {
    if (this.state === 'PLAYING') {
      this.stopTimer();
      this.state = 'PAUSED';
      return true;
    }
    return false;
  }

  resumeGame() {
    if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.startTimer();
      return true;
    }
    return false;
  }

  /**
   * Submits player word response.
   */
  submitWord(rawWord) {
    if (this.state !== 'PLAYING' || this.isProcessingTurn) {
      return { handled: false, message: 'Game belum dalam giliran aktif' };
    }

    this.isProcessingTurn = true; // Lock turn to prevent race condition with timeout

    const validation = this.validator.validate(
      rawWord,
      this.requiredLetter,
      this.usedWords,
      this.activeChallenge
    );

    if (validation.valid) {
      this.stopTimer();
      this.handleWordSuccess(validation.normalized);
      return { handled: true, success: true, message: validation.reason, word: validation.normalized };
    } else {
      this.audio.playError();
      this.isProcessingTurn = false; // Unlock so player can re-type before timer runs out
      return { handled: true, success: false, message: validation.reason };
    }
  }

  /**
   * Handles a successful word submission.
   */
  handleWordSuccess(validWord) {
    const player = this.getCurrentPlayer();
    this.usedWords.add(validWord);
    this.currentWord = validWord;
    this.requiredLetter = this.validator.getLastLetter(validWord);
    this.totalRoundsPlayed++;

    // Calculate score
    let points = validWord.length * 10;
    if (this.activeChallenge) {
      if (this.activeChallenge.multiplier) {
        points *= this.activeChallenge.multiplier;
      }
      if (this.activeChallenge.quickThreshold && (this.turnDuration - this.remainingTime) <= this.activeChallenge.quickThreshold) {
        points += 50; // Quick chain streak bonus
      }
    }
    player.score += points;

    this.wordHistory.unshift({
      word: validWord,
      player: player.name,
      points
    });

    this.audio.playCorrect();

    if (this.onWordAccepted) {
      this.onWordAccepted({
        word: validWord,
        player,
        points,
        nextLetter: this.requiredLetter
      });
    }

    // Advance to next active player smoothly
    const advanceDelay = this.config.autoStartTurn ? 500 : 600;
    setTimeout(() => {
      this.advanceTurn();
    }, advanceDelay);
  }

  /**
   * Handles timer timeout (failure).
   */
  handleTimeout() {
    if (this.isProcessingTurn) return;
    this.isProcessingTurn = true;

    this.audio.playError();
    const player = this.getCurrentPlayer();
    let penalty = 1;

    if (this.activeChallenge && this.activeChallenge.penaltyLives) {
      penalty = this.activeChallenge.penaltyLives;
    }

    if (this.config.mode === 'lps' || this.config.mode === 'suddendeath') {
      player.lives = Math.max(0, player.lives - penalty);
      if (player.lives === 0) {
        player.status = 'ELIMINATED';
        if (this.onPlayerEliminated) {
          this.onPlayerEliminated(player);
        }
      }
    }

    if (this.onWordRejected) {
      this.onWordRejected({
        player,
        reason: 'Waktu giliran habis!',
        eliminated: player.status === 'ELIMINATED'
      });
    }

    // Check if game is over
    const isOver = this.checkGameOver();
    if (!isOver) {
      setTimeout(() => {
        this.advanceTurn();
      }, 900);
    }
  }

  /**
   * Advances turn to next active (non-eliminated) player.
   */
  advanceTurn() {
    const activePlayers = this.getActivePlayers();
    if (activePlayers.length <= 1 && (this.config.mode === 'lps' || this.config.mode === 'suddendeath')) {
      this.checkGameOver();
      return;
    }

    if (this.config.mode === 'freeplay' && this.totalRoundsPlayed >= this.config.freePlayMaxRounds) {
      this.checkGameOver();
      return;
    }

    // Find next active player index
    let nextIndex = (this.currentPlayerIndex + 1) % this.players.length;
    let loopCount = 0;

    while (this.players[nextIndex].status === 'ELIMINATED' && loopCount < this.players.length) {
      nextIndex = (nextIndex + 1) % this.players.length;
      loopCount++;
    }

    this.currentPlayerIndex = nextIndex;
    this.prepareTurn();
  }

  /**
   * Use lifeline to reroll required letter.
   */
  useLifeline() {
    if (this.state !== 'PLAYING') return false;
    const player = this.getCurrentPlayer();
    const isFree = this.activeChallenge && this.activeChallenge.freeLifeline;

    if (!isFree && player.lifelines <= 0) return false;

    if (!isFree) {
      player.lifelines--;
    }

    // Pick a new friendly random letter
    const vowels = ['a', 'e', 'i', 'u', 'o', 'b', 'k', 'm', 't', 's'];
    const filtered = vowels.filter(v => v !== this.requiredLetter);
    this.requiredLetter = filtered[Math.floor(Math.random() * filtered.length)];

    return true;
  }

  checkGameOver() {
    const activePlayers = this.getActivePlayers();

    if (this.config.mode === 'lps' || this.config.mode === 'suddendeath') {
      if (activePlayers.length === 1) {
        this.endGame(activePlayers[0]);
        return true;
      } else if (activePlayers.length === 0) {
        const sorted = [...this.players].sort((a, b) => b.score - a.score);
        this.endGame(sorted[0] || null);
        return true;
      }
    } else if (this.config.mode === 'freeplay') {
      if (this.totalRoundsPlayed >= this.config.freePlayMaxRounds) {
        const sorted = [...this.players].sort((a, b) => b.score - a.score);
        this.endGame(sorted[0]);
        return true;
      }
    }

    return false;
  }

  endGame(winnerPlayer) {
    this.stopTimer();
    this.state = 'GAME_OVER';
    this.winner = winnerPlayer;
    this.audio.playVictory();

    if (this.onGameOver) {
      this.onGameOver({
        winner: winnerPlayer,
        players: [...this.players].sort((a, b) => b.score - a.score),
        totalWords: this.wordHistory.length,
        roundsPlayed: this.totalRoundsPlayed,
        longestWord: this.getLongestWord()
      });
    }
  }

  getLongestWord() {
    if (!this.wordHistory.length) return '-';
    let longest = '';
    for (const item of this.wordHistory) {
      if (item.word.length > longest.length) {
        longest = item.word;
      }
    }
    return longest.toUpperCase();
  }

  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex] || null;
  }

  getActivePlayers() {
    return this.players.filter(p => p.status === 'ACTIVE');
  }
}
