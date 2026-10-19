/**
 * SAMBUNGIN! — Lobby UI Module
 * Handles Host Lobby and Client Lobby views, roster updates, and room connection states.
 */

import { escapeHtml } from './game-arena.js';

export class LobbyUI {
  constructor(dom, app) {
    this.dom = dom;
    this.app = app;
  }

  renderHostLobbyPlayers() {
    const players = [
      { id: this.app.network.myPeerId, name: `${this.app.network.myName} (Host)` }
    ];

    this.app.network.clients.forEach(c => {
      players.push({ id: c.id, name: c.name });
    });

    if (this.dom.hostLobbyPlayersList) this.dom.hostLobbyPlayersList.innerHTML = '';
    if (this.dom.hostPlayerCountBadge) this.dom.hostPlayerCountBadge.textContent = `${players.length} Pemain`;

    players.forEach((p, idx) => {
      const row = document.createElement('div');
      row.className = 'lobby-player-pill';
      row.innerHTML = `
        <span style="font-weight: 700;">${idx + 1}. ${escapeHtml(p.name)}</span>
        <span class="lobby-player-role">${idx === 0 ? '👑 HOST' : 'READY ✅'}</span>
      `;
      if (this.dom.hostLobbyPlayersList) this.dom.hostLobbyPlayersList.appendChild(row);
    });

    if (this.dom.hostValidationMsg && this.dom.btnHostStartGame) {
      if (players.length >= 2) {
        this.dom.hostValidationMsg.textContent = 'Room siap! Klik tombol di bawah untuk mulai.';
        this.dom.hostValidationMsg.style.color = 'var(--color-success)';
        this.dom.btnHostStartGame.disabled = false;
      } else {
        this.dom.hostValidationMsg.textContent = 'Tunggu minimal 1 teman bergabung...';
        this.dom.hostValidationMsg.style.color = 'var(--color-warning)';
        this.dom.btnHostStartGame.disabled = true;
      }
    }
  }

  broadcastLobbyRoster() {
    const players = [
      { id: this.app.network.myPeerId, name: `${this.app.network.myName} (Host)` }
    ];
    this.app.network.clients.forEach(c => {
      players.push({ id: c.id, name: c.name });
    });

    this.app.network.broadcast('LOBBY_ROSTER_UPDATE', { players });
  }

  renderClientLobbyPlayers(players) {
    if (!this.dom.clientLobbyPlayersList || !Array.isArray(players)) return;
    this.dom.clientLobbyPlayersList.innerHTML = '';
    players.forEach((p, idx) => {
      const isMe = (p.id === this.app.myNetworkId);
      const row = document.createElement('div');
      row.className = 'lobby-player-pill';
      if (isMe) {
        row.style.borderColor = 'var(--color-accent)';
      }

      let roleBadge = 'READY ✅';
      if (idx === 0) {
        roleBadge = '👑 HOST';
      } else if (isMe) {
        roleBadge = 'KAMU ⭐';
      }

      row.innerHTML = `
        <span style="font-weight: 700;">${idx + 1}. ${escapeHtml(p.name)} ${isMe && idx !== 0 ? '<small style="color:var(--color-accent)">(Kamu)</small>' : ''}</span>
        <span class="lobby-player-role">${roleBadge}</span>
      `;
      this.dom.clientLobbyPlayersList.appendChild(row);
    });
  }
}
