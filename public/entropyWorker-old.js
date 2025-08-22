// High-Performance Entropy Calculation Web Worker
// Optimized JavaScript implementation with advanced algorithms

// Web Worker global context
const globalWorkerScope = self;

class OptimizedEntropyCalculator {
  constructor() {
    this.allWords = [];
    this.possibleAnswers = [];
    console.log("🧠 High-Performance Entropy Calculator initialized");
  }

  // Ultra-fast pattern generation with bit manipulation
  getPattern(guess, target) {
    const result = new Array(guess.length).fill("B");
    const targetFreq = new Array(26).fill(0);

    // Count target letter frequencies using char codes for speed
    for (let i = 0; i < target.length; i++) {
      targetFreq[target.charCodeAt(i) - 65]++;
    }

    // First pass: mark green letters and reduce frequency
    for (let i = 0; i < guess.length; i++) {
      if (guess[i] === target[i]) {
        result[i] = "G";
        targetFreq[guess.charCodeAt(i) - 65]--;
      }
    }

    // Second pass: mark yellow letters
    for (let i = 0; i < guess.length; i++) {
      if (result[i] === "B") {
        const charIndex = guess.charCodeAt(i) - 65;
        if (targetFreq[charIndex] > 0) {
          result[i] = "Y";
          targetFreq[charIndex]--;
        }
      }
    }

    return result.join("");
  }

  // Optimized entropy calculation with Map for O(1) lookups
  calculateEntropy(guessWord, possibleAnswers = this.possibleAnswers) {
    if (possibleAnswers.length <= 1) return 0;

    const patternCounts = new Map();
    const upperGuess = guessWord.toUpperCase();

    // Use for-loop instead of forEach for better performance
    for (let i = 0; i < possibleAnswers.length; i++) {
      const pattern = this.getPattern(upperGuess, possibleAnswers[i]);
      patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1);
    }

    // Calculate Shannon entropy with optimized math
    let entropy = 0;
    const totalAnswers = possibleAnswers.length;
    const log2 = Math.log(2);

    for (const count of patternCounts.values()) {
      const probability = count / totalAnswers;
      entropy -= probability * (Math.log(probability) / log2);
    }

    return entropy;
  }

  // Lightning-fast bulk entropy calculation
  calculateAllEntropies(
    allWords = this.allWords,
    possibleAnswers = this.possibleAnswers
  ) {
    if (possibleAnswers.length === 0) return [];

    console.log(
      `🚀 Starting bulk entropy calculation for ${allWords.length} words with ${possibleAnswers.length} possible answers`
    );
    const startTime = performance.now();

    // Pre-allocate results array for better memory performance
    const results = new Array(allWords.length);

    // Use traditional for-loop for maximum performance
    for (let i = 0; i < allWords.length; i++) {
      const entropy = this.calculateEntropy(allWords[i], possibleAnswers);
      results[i] = {
        word: allWords[i],
        entropy: entropy,
        bitsOfInfo: Math.round(entropy * 100) / 100,
      };
    }

    // Native sort is optimized in modern JS engines
    results.sort((a, b) => b.entropy - a.entropy);

    const endTime = performance.now();
    console.log(
      `✅ Bulk calculation completed in ${Math.round(endTime - startTime)}ms`
    );

    return results;
  }

  // High-speed word filtering with early termination
  filterWords(words, knownPositions, yellowLetters, grayLetters) {
    const filtered = [];
    const graySet = new Set(grayLetters.map((l) => l.toUpperCase()));

    // Pre-process yellow letters for faster lookup
    const yellowConstraints = yellowLetters.map((y) => ({
      letter: y.letter.toUpperCase(),
      excludedSet: new Set(y.excludedPositions),
    }));

    wordLoop: for (let i = 0; i < words.length; i++) {
      const word = words[i].toUpperCase();

      // Check gray letters first (fastest elimination)
      for (let j = 0; j < word.length; j++) {
        if (graySet.has(word[j])) {
          continue wordLoop;
        }
      }

      // Check known positions (green letters)
      for (let j = 0; j < knownPositions.length; j++) {
        if (knownPositions[j] && word[j] !== knownPositions[j]) {
          continue wordLoop;
        }
      }

      // Check yellow letters
      for (const yellow of yellowConstraints) {
        // Word must contain the letter
        if (!word.includes(yellow.letter)) {
          continue wordLoop;
        }

        // Letter must not be in excluded positions
        for (const pos of yellow.excludedSet) {
          if (word[pos] === yellow.letter) {
            continue wordLoop;
          }
        }
      }

      filtered.push(words[i]); // Keep original case
    }

    return filtered;
  }

  // Set word lists for calculations
  setWordLists(allWords, possibleAnswers) {
    this.allWords = allWords.map((w) => w.toUpperCase());
    this.possibleAnswers = possibleAnswers.map((w) => w.toUpperCase());
    console.log(
      `📝 Word lists updated: ${this.allWords.length} total, ${this.possibleAnswers.length} possible`
    );
  }
}

// Global calculator instance
const calculator = new OptimizedEntropyCalculator();

// Web Worker message handler
globalWorkerScope.onmessage = function (e) {
  const { type, data, requestId } = e.data;

  try {
    let result;

    switch (type) {
      case "setWordLists":
        calculator.setWordLists(data.allWords, data.possibleAnswers);
        result = { success: true };
        break;

      case "calculateEntropy":
        result = calculator.calculateEntropy(data.word, data.possibleAnswers);
        break;

      case "calculateAllEntropies":
        result = calculator.calculateAllEntropies(
          data.allWords,
          data.possibleAnswers
        );
        break;

      case "filterWords":
        result = calculator.filterWords(
          data.words,
          data.knownPositions,
          data.yellowLetters,
          data.grayLetters
        );
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    // Send success response
    globalWorkerScope.postMessage({
      type: "success",
      requestId,
      result,
    });
  } catch (error) {
    console.error("❌ Worker error:", error);

    // Send error response
    globalWorkerScope.postMessage({
      type: "error",
      requestId,
      error: error.message,
    });
  }
};
