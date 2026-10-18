/**
 * SAMBUNGIN! — Game Arena UI Module
 * Handles game arena rendering, turn status banner, input state, timers, and word history.
 */

export function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export class GameArenaUI {
  constructor(dom, app) {
    this.dom = dom;
    this.app = app;
  }

  updateGameArena() {
    const player = this.app.engine.getCurrentPlayer();
    if (!player) return;

    if (this.dom.gameActivePlayerName) {
      this.dom.gameActivePlayerName.textContent = player.name;
    }

    if (this.app.engine.config.mode === 'freeplay') {
      if (this.dom.gamePlayerLivesBadge) this.dom.gamePlayerLivesBadge.style.display = 'none';
    } else {
      if (this.dom.gamePlayerLivesBadge) this.dom.gamePlayerLivesBadge.style.display = 'inline-flex';
      if (this.dom.gamePlayerLivesVal) this.dom.gamePlayerLivesVal.textContent = player.lives;
    }
    if (this.dom.gamePlayerScoreVal) {
      this.dom.gamePlayerScoreVal.textContent = player.score;
    }

    const challenge = this.app.engine.activeChallenge;
    if (challenge) {
      if (this.dom.gameChallengeBanner) this.dom.gameChallengeBanner.classList.remove('hidden');
      if (this.dom.challengeIcon) this.dom.challengeIcon.textContent = challenge.icon || '🎯';
      if (this.dom.challengeTitle) this.dom.challengeTitle.textContent = challenge.title;
      if (this.dom.challengeInstruction) this.dom.challengeInstruction.textContent = challenge.instruction;
    } else {
      if (this.dom.gameChallengeBanner) this.dom.gameChallengeBanner.classList.add('hidden');
    }

    const prev = this.app.engine.currentWord || '';
    if (this.dom.gamePrevWord) {
      if (prev.length > 1) {
        const stem = prev.slice(0, -1);
        const last = prev.slice(-1);
        this.dom.gamePrevWord.innerHTML = `<span class="prev-stem">${escapeHtml(stem.toUpperCase())}</span><span class="prev-last-char">${escapeHtml(last.toUpperCase())}</span>`;
      } else {
        this.dom.gamePrevWord.innerHTML = `<span class="prev-last-char">${escapeHtml(prev.toUpperCase())}</span>`;
      }
    }

    const req = (this.app.engine.requiredLetter || '').toUpperCase();
    if (this.dom.gameRequiredLetter) {
      this.dom.gameRequiredLetter.textContent = req;
    }
    if (this.dom.inputPrefixLetter) {
      this.dom.inputPrefixLetter.textContent = req;
    }

    if (this.dom.lifelineCount) {
      this.dom.lifelineCount.textContent = player.lifelines;
    }
    if (this.dom.btnUseLifeline) {
      this.dom.btnUseLifeline.disabled = (player.lifelines <= 0 && !(challenge && challenge.freeLifeline));
    }

    if (this.dom.wordFeedbackMsg) {
      this.dom.wordFeedbackMsg.textContent = '';
      this.dom.wordFeedbackMsg.className = 'word-feedback';
    }

    this.updateTurnActiveState(player, this.app.engine.requiredLetter);
  }

  updateTurnActiveState(player, requiredLetter) {
    if (!player) return;

    this.app.currentTurnPlayer = player;
    const isMyTurn = (this.app.gameSessionType === 'LOCAL' || player.id === this.app.myNetworkId);
    const req = (requiredLetter || '').toUpperCase();

    if (this.dom.inputPrefixLetter) {
      this.dom.inputPrefixLetter.textContent = req;
    }

    if (this.dom.gameTurnBanner && this.dom.bannerMainText) {
      const badgeEl = this.dom.gameTurnBanner.querySelector('.banner-badge');
      if (isMyTurn) {
        this.dom.gameTurnBanner.className = 'turn-banner-box banner-active-turn';
        if (badgeEl) badgeEl.textContent = '🔥 GILIRAN KAMU!';
        this.dom.bannerMainText.textContent = `Ketik kata berawalan ${req}!`;
      } else {
        this.dom.gameTurnBanner.className = 'turn-banner-box banner-spectator';
        if (badgeEl) badgeEl.textContent = '👀 SEDANG MENONTON';
        this.dom.bannerMainText.textContent = `Menunggu ${player.name} berpikir...`;
      }
    }

    if (isMyTurn) {
      if (this.dom.formSubmitWord) {
        this.dom.formSubmitWord.style.display = 'block';
        this.dom.formSubmitWord.classList.remove('hidden');
      }
      if (this.dom.spectatorReactionBox) {
        this.dom.spectatorReactionBox.style.display = 'none';
        this.dom.spectatorReactionBox.classList.add('hidden');
      }
      if (this.dom.inputWord) {
        this.dom.inputWord.disabled = false;
        this.dom.inputWord.readOnly = false;
        this.dom.inputWord.value = '';
        this.dom.inputWord.placeholder = 'Ketik kelanjutannya...';
      }
      if (this.dom.btnSubmitWord) this.dom.btnSubmitWord.disabled = false;
      if (this.dom.btnUseLifeline) this.dom.btnUseLifeline.disabled = (player.lifelines <= 0);
      this.app.triggerHaptic('turn');
      setTimeout(() => {
        if (this.dom.inputWord && !this.dom.inputWord.disabled && !this.dom.inputWord.readOnly) {
          this.dom.inputWord.focus();
        }
      }, 100);
    } else {
      if (this.dom.formSubmitWord) {
        this.dom.formSubmitWord.style.display = 'none';
        this.dom.formSubmitWord.classList.add('hidden');
      }
      if (this.dom.spectatorReactionBox) {
        this.dom.spectatorReactionBox.style.display = 'flex';
        this.dom.spectatorReactionBox.classList.remove('hidden');
      }
      if (this.dom.spectatorStatusText) {
        this.dom.spectatorStatusText.innerHTML = `Menunggu <strong>${escapeHtml(player.name)}</strong> menjawab...`;
      }
      if (this.dom.inputWord) {
        this.dom.inputWord.disabled = true;
        this.dom.inputWord.readOnly = true;
        this.dom.inputWord.value = '';
        this.dom.inputWord.placeholder = `Giliran ${player.name}...`;
        this.dom.inputWord.blur();
      }
      if (this.dom.btnSubmitWord) this.dom.btnSubmitWord.disabled = true;
      if (this.dom.btnUseLifeline) this.dom.btnUseLifeline.disabled = true;
    }
  }

  updateTimerDisplay(seconds, fraction) {
    if (this.dom.timerSeconds) this.dom.timerSeconds.textContent = seconds;
    if (this.dom.timerProgressBar) this.dom.timerProgressBar.style.width = `${Math.max(0, fraction * 100)}%`;

    if (seconds <= 3) {
      if (this.dom.timerCircle) this.dom.timerCircle.classList.add('timer-critical');
      if (this.dom.timerProgressBar) this.dom.timerProgressBar.classList.add('progress-critical');
      this.app.audio.playTick(true);
    } else {
      if (this.dom.timerCircle) this.dom.timerCircle.classList.remove('timer-critical');
      if (this.dom.timerProgressBar) this.dom.timerProgressBar.classList.remove('progress-critical');
      if (seconds <= 5) {
        this.app.audio.playTick(false);
      }
    }
  }

  setWordFeedback(msg, isSuccess) {
    if (!this.dom.wordFeedbackMsg) return;
    this.dom.wordFeedbackMsg.textContent = msg;
    this.dom.wordFeedbackMsg.className = isSuccess
      ? 'word-feedback feedback-success'
      : 'word-feedback feedback-error';
  }

  renderWordHistory() {
    if (!this.dom.wordHistoryList) return;
    if (this.dom.historyCount) {
      this.dom.historyCount.textContent = this.app.engine.wordHistory.length;
    }
    if (!this.app.engine.wordHistory.length) {
      this.dom.wordHistoryList.innerHTML = '<span class="history-empty">Belum ada kata terhubung</span>';
      return;
    }

    this.dom.wordHistoryList.innerHTML = '';
    this.app.engine.wordHistory.forEach((item, index) => {
      const chip = document.createElement('span');
      chip.className = `history-tag ${index === 0 ? 'latest' : ''}`;
      chip.textContent = `${item.word.toUpperCase()} (${item.player})`;
      this.dom.wordHistoryList.appendChild(chip);
    });
  }
}
