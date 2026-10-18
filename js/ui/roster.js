/**
 * SAMBUNGIN! — Roster UI Module
 * Manages setup player lists, game mini-rosters, and ready screen handoffs.
 */

import { escapeHtml } from './game-arena.js';

export class RosterUI {
  constructor(dom, app) {
    this.dom = dom;
    this.app = app;
  }

  renderPlayerList() {
    if (!this.dom.playerListContainer) return;
    this.dom.playerListContainer.innerHTML = '';
    if (this.dom.playerCountBadge) {
      this.dom.playerCountBadge.textContent = `${this.app.players.length} Pemain`;
    }
    const avatarColors = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#EF4444', '#3B82F6'];

    this.app.players.forEach((p, index) => {
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
          <button type="button" class="btn-icon-subtle btn-delete" title="Hapus" data-id="${p.id}" ${this.app.players.length <= 2 ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : ''}>🗑️</button>
        </div>
      `;

      row.querySelector('.btn-edit').addEventListener('click', () => this.app.handleEditPlayer(p.id));
      const delBtn = row.querySelector('.btn-delete');
      if (this.app.players.length > 2) {
        delBtn.addEventListener('click', () => this.app.handleDeletePlayer(p.id));
      }

      this.dom.playerListContainer.appendChild(row);
    });

    this.app.validateSetupState();
  }

  renderMiniRoster() {
    if (!this.dom.gameMiniRoster) return;
    this.dom.gameMiniRoster.innerHTML = '';
    const current = this.app.engine.getCurrentPlayer();

    this.app.engine.players.forEach(p => {
      const pill = document.createElement('div');
      const isActive = current && current.id === p.id;
      const isEliminated = p.status === 'ELIMINATED';

      pill.className = `mini-player-pill ${isActive ? 'active' : ''} ${isEliminated ? 'eliminated' : ''}`;
      pill.innerHTML = `
        <span class="mini-dot" style="background-color: ${p.color}"></span>
        <span>${escapeHtml(p.name)}</span>
        <span>${this.app.engine.config.mode === 'freeplay' ? `${p.score}⭐` : `${p.lives}❤️`}</span>
      `;
      this.dom.gameMiniRoster.appendChild(pill);
    });
  }

  renderReadyScreen(data) {
    const { player, requiredLetter, challenge, turnDuration } = data;

    if (this.dom.readyPlayerAvatar) {
      this.dom.readyPlayerAvatar.textContent = player.name.charAt(0).toUpperCase();
      this.dom.readyPlayerAvatar.style.backgroundColor = player.color || '#6366F1';
    }
    if (this.dom.readyPlayerName) {
      this.dom.readyPlayerName.textContent = player.name;
    }
    if (this.dom.readyRequiredLetter) {
      this.dom.readyRequiredLetter.textContent = requiredLetter.toUpperCase();
    }
    if (this.dom.readyTimerDesc) {
      this.dom.readyTimerDesc.textContent = `${turnDuration} Detik`;
    }

    if (this.dom.readyPromptInstruction) {
      if (this.app.gameSessionType === 'NETWORK') {
        const isMyTurn = (player.id === this.app.myNetworkId);
        this.dom.readyPromptInstruction.innerHTML = isMyTurn
          ? `🔥 Ini adalah <strong>giliran kamu</strong>! Tekan tombol di bawah untuk mulai menjawab.`
          : `⏳ Giliran <strong>${player.name}</strong>. Bersiaplah memperhatikan kata berikutnya!`;
      } else {
        this.dom.readyPromptInstruction.innerHTML = `Pastikan perangkat sudah di tanganmu. Waktu <strong>TIDAK AKAN BERJALAN</strong> sebelum kamu menekan tombol di bawah!`;
      }
    }

    if (this.dom.readyChallengeDesc) {
      if (challenge) {
        this.dom.readyChallengeDesc.textContent = `${challenge.icon || '🎯'} ${challenge.title} — ${challenge.instruction}`;
        this.dom.readyChallengeDesc.style.color = 'var(--color-pink)';
      } else {
        this.dom.readyChallengeDesc.textContent = 'Standar (Tanpa Batasan Khusus)';
        this.dom.readyChallengeDesc.style.color = 'var(--text-muted)';
      }
    }
  }
}
