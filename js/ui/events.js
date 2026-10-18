/**
 * SAMBUNGIN! — Events Binder Module
 * Connects all UI buttons, selectors, modal toggles, and form submissions to controller methods.
 */

export function bindEvents(app) {
  const on = (el, evt, fn) => {
    if (el) el.addEventListener(evt, fn);
  };

  // 1. Home Navigation
  on(app.dom.btnStartSetup, 'click', () => {
    app.audio.playClick();
    app.gameSessionType = 'LOCAL';
    app.showScreen('setup');
  });

  on(app.dom.btnOpenMultiplayer, 'click', () => {
    app.audio.playClick();
    app.gameSessionType = 'NETWORK';
    app.showScreen('multiChoice');
  });

  const cardMabar = document.getElementById('card-mode-multiplayer');
  on(cardMabar, 'click', () => {
    app.audio.playClick();
    app.gameSessionType = 'NETWORK';
    app.showScreen('multiChoice');
  });
  const cardPassplay = document.getElementById('card-mode-passplay');
  on(cardPassplay, 'click', () => {
    app.audio.playClick();
    app.gameSessionType = 'LOCAL';
    app.showScreen('setup');
  });

  on(app.dom.btnBackMultiToHome, 'click', () => {
    app.audio.playClick();
    app.showScreen('home');
  });

  on(app.dom.btnBackToHome, 'click', () => {
    app.audio.playClick();
    app.showScreen('home');
  });

  on(app.dom.navBrandBtn, 'click', () => {
    if (app.engine && app.engine.state === 'PLAYING') {
      app.openModal('pause');
    } else {
      app.audio.playClick();
      app.showScreen('home');
    }
  });

  // 2. Modals
  on(app.dom.btnQuickRules, 'click', () => {
    app.audio.playClick();
    app.openModal('howTo');
  });
  on(app.dom.btnOpenHowTo, 'click', () => {
    app.audio.playClick();
    app.openModal('howTo');
  });
  on(app.dom.btnCloseHowTo, 'click', () => app.closeModal('howTo'));
  on(app.dom.btnCloseHowToBottom, 'click', () => app.closeModal('howTo'));

  on(app.dom.btnHomeSettings, 'click', () => {
    app.audio.playClick();
    app.openModal('settings');
  });
  on(app.dom.btnOpenSettings, 'click', () => {
    app.audio.playClick();
    app.openModal('settings');
  });
  on(app.dom.btnCloseSettings, 'click', () => app.closeModal('settings'));
  on(app.dom.btnCloseSettingsBottom, 'click', () => app.closeModal('settings'));

  // 3. Settings Form
  if (app.dom.settingSound) {
    app.dom.settingSound.addEventListener('change', (e) => {
      app.prefs.sound = e.target.checked;
      app.audio.setEnabled(app.prefs.sound);
      app.saveData();
    });
  }

  if (app.dom.settingVolume) {
    app.dom.settingVolume.addEventListener('input', (e) => {
      app.prefs.volume = parseInt(e.target.value, 10);
      app.audio.setVolume(app.prefs.volume);
      app.saveData();
    });
  }

  if (app.dom.settingAnimations) {
    app.dom.settingAnimations.addEventListener('change', (e) => {
      app.prefs.animations = e.target.checked;
      app.saveData();
    });
  }

  if (app.dom.settingVibration) {
    app.dom.settingVibration.addEventListener('change', (e) => {
      app.prefs.vibration = e.target.checked;
      app.saveData();
    });
  }

  if (app.dom.btnResetStorage) {
    app.dom.btnResetStorage.addEventListener('click', () => {
      if (confirm('Yakin ingin mereset data pemain dan setelan?')) {
        localStorage.clear();
        app.players = [
          { id: 'p1', name: 'Pemain 1' },
          { id: 'p2', name: 'Pemain 2' }
        ];
        app.renderPlayerList();
        app.showToast('Data berhasil direset.');
        app.closeModal('settings');
      }
    });
  }

  // 4. Pass & Play Player Setup
  if (app.dom.formAddPlayer) {
    app.dom.formAddPlayer.addEventListener('submit', (e) => {
      e.preventDefault();
      app.handleAddPlayer();
    });
  }

  document.querySelectorAll('.mode-selector .pill-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      app.audio.playClick();
      document.querySelectorAll('.mode-selector .pill-opt').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-checked', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-checked', 'true');
      app.setupConfig.mode = btn.dataset.mode;
      if (app.dom.livesSettingGroup) {
        app.dom.livesSettingGroup.style.display = (app.setupConfig.mode === 'lps') ? 'block' : 'none';
      }
    });
  });

  document.querySelectorAll('.setup-flow-selector .pill-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      app.audio.playClick();
      document.querySelectorAll('.setup-flow-selector .pill-opt').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-checked', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-checked', 'true');
      app.setupConfig.letterFlow = btn.dataset.flow || 'chain';
    });
  });

  document.querySelectorAll('.timer-grid .chip-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      app.audio.playClick();
      document.querySelectorAll('.timer-grid .chip-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      app.setupConfig.timer = parseInt(btn.dataset.timer, 10);
    });
  });

  document.querySelectorAll('.lives-grid .chip-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      app.audio.playClick();
      document.querySelectorAll('.lives-grid .chip-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      app.setupConfig.lives = parseInt(btn.dataset.lives, 10);
    });
  });

  document.querySelectorAll('.challenge-grid .chip-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      app.audio.playClick();
      document.querySelectorAll('.challenge-grid .chip-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      app.setupConfig.challenge = btn.dataset.challenge;
    });
  });

  if (app.dom.btnStartGame) {
    app.dom.btnStartGame.addEventListener('click', () => {
      app.handleStartGame();
    });
  }

  // 5. Multiplayer (Host / Client) Room Management
  if (app.dom.btnChoiceCreateRoom) {
    app.dom.btnChoiceCreateRoom.addEventListener('click', () => {
      app.audio.playClick();
      app.handleCreateHostRoom();
    });
  }

  if (app.dom.btnChoiceJoinRoom) {
    app.dom.btnChoiceJoinRoom.addEventListener('click', () => {
      app.audio.playClick();
      app.showScreen('lobbyClient');
      if (app.dom.clientConnectBox) app.dom.clientConnectBox.classList.remove('hidden');
      if (app.dom.clientWaitingBox) app.dom.clientWaitingBox.classList.add('hidden');
    });
  }

  if (app.dom.btnCopyRoomCode) {
    app.dom.btnCopyRoomCode.addEventListener('click', () => {
      if (app.network.roomCode) {
        navigator.clipboard.writeText(app.network.roomCode).then(() => {
          app.showToast(`Kode "${app.network.roomCode}" berhasil disalin!`);
        }).catch(() => {
          app.showToast(`Kode Room: ${app.network.roomCode}`);
        });
      }
    });
  }

  if (app.dom.btnShareWa) {
    app.dom.btnShareWa.addEventListener('click', () => {
      app.audio.playClick();
      const code = app.network.roomCode || '';
      const shareUrl = `${window.location.origin}${window.location.pathname}?room=${code}`;
      const msg = `Yuk mabar SAMBUNGIN! Game party sambung kata seru bareng aku! 🎮🔥\n\nKlik link ini untuk langsung gabung room:\n${shareUrl}\n\nAtau masukkan Kode Room: ${code}`;
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
      window.open(waUrl, '_blank');
    });
  }

  if (app.dom.btnCopyLink) {
    app.dom.btnCopyLink.addEventListener('click', () => {
      app.audio.playClick();
      const code = app.network.roomCode || '';
      const shareUrl = `${window.location.origin}${window.location.pathname}?room=${code}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        app.showToast('Link gabung langsung berhasil disalin!');
      }).catch(() => {
        app.showToast(`Link: ${shareUrl}`);
      });
    });
  }

  // Reaction Emote Buttons
  document.querySelectorAll('.btn-emote').forEach(btn => {
    btn.addEventListener('click', () => {
      const emoji = btn.dataset.emoji || btn.textContent.trim();
      app.audio.playPop();
      app.triggerFloatingEmote(emoji);
      if (app.gameSessionType === 'NETWORK') {
        app.network.sendReaction(emoji);
      }
    });
  });

  if (app.dom.btnLeaveHostRoom) {
    app.dom.btnLeaveHostRoom.addEventListener('click', () => {
      app.audio.playClick();
      app.network.disconnect();
      app.showScreen('home');
    });
  }

  if (app.dom.btnLeaveClientRoom) {
    app.dom.btnLeaveClientRoom.addEventListener('click', () => {
      app.audio.playClick();
      app.network.disconnect();
      app.showScreen('home');
    });
  }

  // Host Config Selectors in Lobby
  document.querySelectorAll('.host-mode-selector .pill-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      app.audio.playClick();
      document.querySelectorAll('.host-mode-selector .pill-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      app.setupConfig.mode = btn.dataset.mode;
    });
  });

  document.querySelectorAll('.host-flow-selector .pill-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      app.audio.playClick();
      document.querySelectorAll('.host-flow-selector .pill-opt').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-checked', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-checked', 'true');
      app.setupConfig.letterFlow = btn.dataset.flow || 'chain';
    });
  });

  document.querySelectorAll('.host-timer-grid .chip-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      app.audio.playClick();
      document.querySelectorAll('.host-timer-grid .chip-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      app.setupConfig.timer = parseInt(btn.dataset.timer, 10);
    });
  });

  document.querySelectorAll('.host-challenge-grid .chip-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      app.audio.playClick();
      document.querySelectorAll('.host-challenge-grid .chip-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      app.setupConfig.challenge = btn.dataset.challenge;
    });
  });

  if (app.dom.btnHostStartGame) {
    app.dom.btnHostStartGame.addEventListener('click', () => {
      app.handleHostStartGame();
    });
  }

  if (app.dom.formJoinRoom) {
    app.dom.formJoinRoom.addEventListener('submit', (e) => {
      e.preventDefault();
      app.handleClientJoinRoom();
    });
  }

  // 6. Ready Screen Button
  if (app.dom.btnReadyStart) {
    app.dom.btnReadyStart.addEventListener('click', () => {
      app.audio.playClick();
      if (app.gameSessionType === 'LOCAL') {
        app.showScreen('game');
        app.engine.startActiveTurn();
      } else if (app.gameSessionType === 'NETWORK') {
        if (app.network.role === 'HOST') {
          app.showScreen('game');
          app.engine.startActiveTurn();
          app.network.broadcast('REMOTE_START_ACTIVE_TURN', {});
        } else {
          app.network.sendToHost('CLIENT_READY_TO_START', {});
        }
      }
      setTimeout(() => {
        if (app.dom.inputWord) {
          app.dom.inputWord.value = '';
          app.dom.inputWord.focus();
        }
      }, 100);
    });
  }

  // 7. Gameplay Input
  if (app.dom.formSubmitWord) {
    app.dom.formSubmitWord.addEventListener('submit', (e) => {
      e.preventDefault();
      app.handleSubmitWord();
    });
  }

  if (app.dom.inputWord) {
    const blockIfNotMyTurn = (e) => {
      if (!app.isMyTurnNow()) {
        e.preventDefault();
        e.stopPropagation();
        app.dom.inputWord.readOnly = true;
        app.dom.inputWord.disabled = true;
        app.dom.inputWord.blur();
        return false;
      }
    };
    app.dom.inputWord.addEventListener('keydown', blockIfNotMyTurn);
    app.dom.inputWord.addEventListener('beforeinput', blockIfNotMyTurn);
  }

  if (app.dom.btnUseLifeline) {
    app.dom.btnUseLifeline.addEventListener('click', () => {
      app.audio.playClick();
      if (app.gameSessionType === 'LOCAL') {
        const used = app.engine.useLifeline();
        if (used) {
          app.showToast('Bantuan dipakai! Huruf wajib diubah.');
          app.updateGameArena();
        } else {
          app.showToast('Bantuan sudah habis!');
        }
      } else if (app.gameSessionType === 'NETWORK') {
        if (app.network.role === 'HOST') {
          const used = app.engine.useLifeline();
          if (used) {
            app.showToast('Bantuan dipakai! Huruf diubah.');
            app.updateGameArena();
            app.network.broadcast('REMOTE_ARENA_SYNC', {
              requiredLetter: app.engine.requiredLetter,
              lifelines: app.engine.getCurrentPlayer().lifelines
            });
          }
        } else {
          app.network.sendToHost('CLIENT_USE_LIFELINE', {});
        }
      }
    });
  }

  if (app.dom.btnPauseGame) {
    app.dom.btnPauseGame.addEventListener('click', () => {
      app.audio.playClick();
      if (app.gameSessionType === 'LOCAL') {
        app.engine.pauseGame();
        app.openModal('pause');
      } else {
        app.showToast('Jeda dinonaktifkan dalam mode multi-device online.');
      }
    });
  }

  if (app.dom.btnResumeGame) {
    app.dom.btnResumeGame.addEventListener('click', () => {
      app.audio.playClick();
      app.closeModal('pause');
      app.engine.resumeGame();
    });
  }

  if (app.dom.btnRestartGame) {
    app.dom.btnRestartGame.addEventListener('click', () => {
      app.audio.playClick();
      app.closeModal('pause');
      app.handleStartGame();
    });
  }

  if (app.dom.btnQuitToHome) {
    app.dom.btnQuitToHome.addEventListener('click', () => {
      app.audio.playClick();
      app.engine.stopTimer();
      app.closeModal('pause');
      if (app.gameSessionType === 'NETWORK') {
        app.network.disconnect();
      }
      app.showScreen('home');
    });
  }

  // 8. Results Screen
  if (app.dom.btnPlayAgain) {
    app.dom.btnPlayAgain.addEventListener('click', () => {
      app.audio.playClick();
      if (app.gameSessionType === 'LOCAL') {
        app.handleStartGame();
      } else if (app.gameSessionType === 'NETWORK' && app.network.role === 'HOST') {
        app.handleHostStartGame();
      }
    });
  }

  if (app.dom.btnBackToMenu) {
    app.dom.btnBackToMenu.addEventListener('click', () => {
      app.audio.playClick();
      if (app.gameSessionType === 'NETWORK') {
        app.network.disconnect();
      }
      app.showScreen('home');
    });
  }
}
