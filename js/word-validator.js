/**
 * SAMBUNGIN! — Word Validator Module
 * Normalizes input, checks letter chain rules, prevents duplicates,
 * validates against local dictionary, and handles challenge constraints.
 */
export class WordValidator {
  constructor() {
    this.wordsSet = new Set();
    this.wordsMetadata = new Map(); // word -> { category }
    this.wordsByInitial = {};
    for (let i = 97; i <= 122; i++) {
      this.wordsByInitial[String.fromCharCode(i)] = [];
    }
    this.isLoaded = false;
  }

  /**
   * Normalizes word string: trims, lowercases, strips numbers, punctuation, extra spaces.
   */
  normalize(raw) {
    if (!raw || typeof raw !== 'string') return '';
    return raw
      .trim()
      .toLowerCase()
      .replace(/[^a-z]/g, '');
  }

  /**
   * Loads words from local JSON dataset.
   */
  async loadDataset(url = 'data/words.json') {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Gagal memuat dataset: HTTP ${response.status}`);
      }
      const data = await response.json();
      this.populate(data);
      this.isLoaded = true;
      return true;
    } catch (err) {
      console.warn('WordValidator loadDataset error:', err);
      // Fallback in-memory core words so game never crashes
      this.populateFallback();
      this.isLoaded = true;
      return false;
    }
  }

  populate(data) {
    this.wordsSet.clear();
    this.wordsMetadata.clear();
    this.wordsByInitial = {};
    for (let i = 97; i <= 122; i++) {
      this.wordsByInitial[String.fromCharCode(i)] = [];
    }

    const wordsList = Array.isArray(data) ? data : (data.words || []);
    const catMap = (typeof data === 'object' && !Array.isArray(data) && data.categories) ? data.categories : {};

    for (let i = 0; i < wordsList.length; i++) {
      const item = wordsList[i];
      const w = typeof item === 'string' ? item : item.word;
      const norm = this.normalize(w);
      if (norm) {
        this.wordsSet.add(norm);

        const initChar = norm[0];
        if (this.wordsByInitial[initChar]) {
          this.wordsByInitial[initChar].push(norm);
        }

        // Memory optimization: only allocate metadata for words with specific categories
        let cat = null;
        if (typeof item === 'object' && item && item.category && item.category !== 'umum') {
          cat = String(item.category).toLowerCase();
        } else if (catMap && Object.hasOwn(catMap, norm)) {
          cat = String(catMap[norm]).toLowerCase();
        }

        if (cat) {
          this.wordsMetadata.set(norm, { category: cat });
        }
      }
    }
  }

  populateFallback() {
    const fallbackList = [
      { word: 'buku', category: 'benda' },
      { word: 'ular', category: 'hewan' },
      { word: 'roti', category: 'makanan' },
      { word: 'ikan', category: 'hewan' },
      { word: 'nasi', category: 'makanan' },
      { word: 'kuda', category: 'hewan' },
      { word: 'ayam', category: 'hewan' },
      { word: 'meja', category: 'benda' },
      { word: 'apel', category: 'makanan' },
      { word: 'laut', category: 'tempat' }
    ];
    this.populate(fallbackList);
  }

  /**
   * Validates word according to chain rules, dataset existence, duplicate check, and challenge.
   * @param {string} rawInput 
   * @param {string} requiredLetter 
   * @param {Set<string>} usedWords 
   * @param {object|null} activeChallenge 
   * @returns {{ valid: boolean, reason: string, normalized: string }}
   */
  validate(rawInput, requiredLetter, usedWords, activeChallenge = null) {
    const normalized = this.normalize(rawInput);

    // 1. Empty or invalid format
    if (!normalized || normalized.length < 2) {
      return {
        valid: false,
        reason: 'Kata harus minimal 2 huruf dan tidak boleh kosong!',
        normalized: ''
      };
    }

    // 2. Starts with required letter
    const req = this.normalize(requiredLetter);
    if (req && !normalized.startsWith(req)) {
      return {
        valid: false,
        reason: `Kata '${normalized.toUpperCase()}' diawali huruf '${normalized[0].toUpperCase()}', padahal giliran ini wajib huruf '${req.toUpperCase()}'!`,
        normalized
      };
    }

    // 3. Duplicate check
    if (usedWords && usedWords.has(normalized)) {
      return {
        valid: false,
        reason: `Kata '${normalized.toUpperCase()}' sudah pernah dipakai dalam game ini! Silakan cari kata lain.`,
        normalized
      };
    }

    // 4. Local dictionary check
    if (!this.wordsSet.has(normalized)) {
      return {
        valid: false,
        reason: `Kata '${normalized.toUpperCase()}' tidak ditemukan dalam kamus KBBI / bahasa Inggris!`,
        normalized
      };
    }

    // 5. Active Challenge Constraints
    if (activeChallenge) {
      const challengeCheck = this.validateChallenge(normalized, activeChallenge);
      if (!challengeCheck.valid) {
        return {
          valid: false,
          reason: challengeCheck.reason,
          normalized
        };
      }
    }

    return {
      valid: true,
      reason: 'Kata valid!',
      normalized
    };
  }

  validateChallenge(word, challenge) {
    if (!challenge || !challenge.type) return { valid: true };

    switch (challenge.type) {
      case 'banned_letter': {
        const banned = (challenge.letter || '').toLowerCase();
        if (banned && word.includes(banned)) {
          return {
            valid: false,
            reason: `Tantangan gagal: Kata dilarang mengandung huruf '${banned.toUpperCase()}'!`
          };
        }
        break;
      }
      case 'min_length': {
        const min = challenge.minLength || 5;
        if (word.length < min) {
          return {
            valid: false,
            reason: `Tantangan gagal: Kata minimal harus ${min} huruf! (Kata kamu: ${word.length} huruf)`
          };
        }
        break;
      }
      case 'category': {
        const requiredCat = (challenge.category || '').toLowerCase();
        const meta = this.wordsMetadata.get(word);
        if (!meta || meta.category !== requiredCat) {
          return {
            valid: false,
            reason: `Tantangan gagal: Kata harus bertema '${challenge.categoryTitle || requiredCat}'!`
          };
        }
        break;
      }
      default:
        break;
    }

    return { valid: true };
  }

  getRandomLetter(exclude = null) {
    const letters = [];
    for (let i = 97; i <= 122; i++) {
      const char = String.fromCharCode(i);
      if (this.wordsByInitial[char] && this.wordsByInitial[char].length > 0) {
        if (!exclude || char !== exclude.toLowerCase()) {
          letters.push(char);
        }
      }
    }
    if (!letters.length) return 'a';
    return letters[Math.floor(Math.random() * letters.length)];
  }

  getRandomStartingWord(startingLetter = null) {
    const letter = (startingLetter || this.getRandomLetter()).toLowerCase();
    const list = this.wordsByInitial[letter] || [];
    if (!list.length) return 'buku';
    // Pick common simple starter words with friendly endings (length 3-6)
    const safeStarters = list.filter(w => w.length >= 3 && w.length <= 6);
    const pool = safeStarters.length ? safeStarters : list;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  getLastLetter(word) {
    const norm = this.normalize(word);
    return norm ? norm.slice(-1) : '';
  }
}
