/**
 * SAMBUNGIN! — Challenges System
 * Manages 8 unique party game challenge mechanics:
 * 1. Kategori Wajib
 * 2. Waktu Kilat
 * 3. Larangan Huruf Tertentu
 * 4. Kata Panjang
 * 5. Bonus Poin
 * 6. Hukuman Ekstra / Satu Kesempatan
 * 7. Rantai Cepat
 * 8. Bantuan Terbatas
 */

export class ChallengeSystem {
  constructor() {
    this.categories = [
      { id: 'makanan', label: 'Makanan & Minuman', icon: '🍔' },
      { id: 'hewan', label: 'Hewan / Fauna', icon: '🦁' },
      { id: 'benda', label: 'Benda / Barang', icon: '📦' },
      { id: 'tempat', label: 'Tempat / Lokasi', icon: '🏞️' }
    ];

    this.commonVowels = ['a', 'e', 'i', 'u', 'o'];
  }

  /**
   * Selects a challenge based on difficulty setting ('off', 'casual', 'normal', 'chaos') and mode.
   * @param {string} difficulty 
   * @param {string} gameMode 
   * @param {string} requiredLetter 
   * @returns {object|null}
   */
  rollChallenge(difficulty = 'normal', gameMode = 'lps', requiredLetter = 'a') {
    if (difficulty === 'off') return null;

    // Probability of rolling a challenge in a turn
    const rollRate = {
      casual: 0.35,
      normal: 0.65,
      chaos: 0.95
    }[difficulty] || 0.6;

    if (Math.random() > rollRate) {
      return null; // Standard turn with no modifier
    }

    // List of eligible challenge generators
    const generators = [
      // 1. Kategori Wajib
      () => {
        const cat = this.categories[Math.floor(Math.random() * this.categories.length)];
        return {
          id: 'category',
          type: 'category',
          icon: cat.icon,
          title: `Kategori: ${cat.label}`,
          instruction: `Kata wajib termasuk dalam kategori ${cat.label}!`,
          category: cat.id,
          categoryTitle: cat.label
        };
      },

      // 2. Waktu Kilat
      () => ({
        id: 'fast_time',
        type: 'modifier',
        icon: '⚡',
        title: 'Waktu Kilat!',
        instruction: 'Waktu giliran ini dipotong menjadi 5 detik!',
        overrideTimer: 5
      }),

      // 3. Larangan Huruf Tertentu
      () => {
        // Choose a letter not identical to the required starting letter
        const candidates = this.commonVowels.filter(v => v !== requiredLetter.toLowerCase());
        const banned = candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : 'a';
        return {
          id: 'banned_letter',
          type: 'banned_letter',
          icon: '🚫',
          title: `Larangan Huruf '${banned.toUpperCase()}'`,
          instruction: `Kata dilarang mengandung huruf '${banned.toUpperCase()}'!`,
          letter: banned
        };
      },

      // 4. Kata Panjang
      () => ({
        id: 'min_length',
        type: 'min_length',
        icon: '📏',
        title: 'Kata Panjang!',
        instruction: 'Kata kamu minimal harus terdiri dari 6 huruf!',
        minLength: 6
      }),

      // 5. Bonus Poin (Prioritized for Free Play)
      () => ({
        id: 'bonus_points',
        type: 'reward',
        icon: '⭐',
        title: 'Bonus Poin x2!',
        instruction: 'Jawaban benar giliran ini memberikan poin ganda!',
        multiplier: 2
      }),

      // 6. Satu Kesempatan / Hukuman Ekstra (For LPS mode)
      () => ({
        id: 'extra_penalty',
        type: 'penalty',
        icon: '💀',
        title: 'Hukuman Ekstra!',
        instruction: 'Awas! Jika salah atau waktu habis, kehilangan 2 Nyawa!',
        penaltyLives: 2
      }),

      // 7. Rantai Cepat
      () => ({
        id: 'quick_chain',
        type: 'reward',
        icon: '🔥',
        title: 'Rantai Kilat!',
        instruction: 'Jawab dalam waktu di bawah 4 detik untuk bonus kombo!',
        quickThreshold: 4
      }),

      // 8. Bantuan Ekstra
      () => ({
        id: 'bonus_lifeline',
        type: 'assist',
        icon: '💡',
        title: 'Petunjuk Terbuka!',
        instruction: 'Gunakan bantuan gratis untuk giliran ini tanpa mengurangi kuota!',
        freeLifeline: true
      })
    ];

    // Filter generators based on mode
    let available = generators;
    if (gameMode !== 'lps') {
      // Free play mode doesn't need life penalty
      available = available.filter(gen => {
        const sample = gen();
        return sample.type !== 'penalty';
      });
    }

    const selected = available[Math.floor(Math.random() * available.length)]();
    return selected;
  }
}
