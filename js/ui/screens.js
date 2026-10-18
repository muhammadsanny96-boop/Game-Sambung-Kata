/**
 * SAMBUNGIN! — Screens & Modals Manager
 * Controls screen transitions, modals, and toast messages.
 */

export class ScreenManager {
  constructor(dom, app = null) {
    this.dom = dom;
    this.app = app;
  }

  showScreen(name) {
    if (this.app && this.app.confettiAnimationId) {
      cancelAnimationFrame(this.app.confettiAnimationId);
      this.app.confettiAnimationId = null;
      if (this.dom.confettiCanvas) {
        const ctx = this.dom.confettiCanvas.getContext('2d');
        ctx.clearRect(0, 0, this.dom.confettiCanvas.width, this.dom.confettiCanvas.height);
      }
    }

    if (this.dom.screens) {
      Object.values(this.dom.screens).forEach(scr => {
        if (scr) scr.classList.remove('active');
      });
      if (this.dom.screens[name]) {
        this.dom.screens[name].classList.add('active');
      }
    }
  }

  openModal(name) {
    if (this.dom.modals && this.dom.modals[name]) {
      this.dom.modals[name].classList.remove('hidden');
    }
  }

  closeModal(name) {
    if (this.dom.modals && this.dom.modals[name]) {
      this.dom.modals[name].classList.add('hidden');
    }
  }

  showToast(msg, duration = 2500) {
    if (!this.dom.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    this.dom.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, duration);
  }
}
