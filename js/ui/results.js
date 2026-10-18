/**
 * SAMBUNGIN! — Results UI Module
 * Handles game over summary screen, leaderboard ranking, and victory confetti.
 */

import { escapeHtml } from './game-arena.js';

export class ResultsUI {
  constructor(dom, app) {
    this.dom = dom;
    this.app = app;
  }

  renderResultsScreen(summary) {
    const { winner, players, totalWords, roundsPlayed, longestWord } = summary;

    const modeLabels = {
      lps: 'Mode Last Player Standing',
      freeplay: 'Mode Free Play (Skor Terbanyak)',
      suddendeath: 'Mode Sudden Death'
    };
    if (this.dom.resultsModeDesc) {
      this.dom.resultsModeDesc.textContent = modeLabels[this.app.engine.config.mode] || 'Hasil Sesi Permainan';
    }

    if (winner) {
      if (this.dom.resultsWinnerAvatar) this.dom.resultsWinnerAvatar.textContent = '👑';
      if (this.dom.resultsWinnerName) this.dom.resultsWinnerName.textContent = winner.name;
      if (this.dom.resultsWinnerLabel) {
        this.dom.resultsWinnerLabel.textContent = this.app.engine.config.mode === 'freeplay'
          ? `JUARA DENGAN ${winner.score} POIN!`
          : 'JUARA BERTAHAN TERAKHIR!';
      }
    } else {
      if (this.dom.resultsWinnerAvatar) this.dom.resultsWinnerAvatar.textContent = '🤝';
      if (this.dom.resultsWinnerName) this.dom.resultsWinnerName.textContent = 'Hasil Seri';
      if (this.dom.resultsWinnerLabel) this.dom.resultsWinnerLabel.textContent = 'Semua pemain gugur bersamaan!';
    }

    if (this.dom.resultsLeaderboardList) {
      this.dom.resultsLeaderboardList.innerHTML = '';
      players.forEach((p, idx) => {
        const item = document.createElement('div');
        item.className = `leaderboard-item ${idx === 0 ? 'rank-1' : ''}`;
        item.innerHTML = `
          <span>#${idx + 1} <strong>${escapeHtml(p.name)}</strong></span>
          <span>${p.score} Poin (${p.status === 'ELIMINATED' ? 'Gugur' : 'Bertahan'})</span>
        `;
        this.dom.resultsLeaderboardList.appendChild(item);
      });
    }

    if (this.dom.statTotalWords) this.dom.statTotalWords.textContent = totalWords;
    if (this.dom.statLongestWord) this.dom.statLongestWord.textContent = longestWord;
    if (this.dom.statRoundsCount) this.dom.statRoundsCount.textContent = roundsPlayed;
  }

  launchConfetti() {
    if (!this.dom.confettiCanvas) return;
    const canvas = this.dom.confettiCanvas;
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
        this.app.confettiAnimationId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    render();
  }
}
