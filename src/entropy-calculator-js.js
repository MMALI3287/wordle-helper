// Temporary JavaScript replacement for WebAssembly
// This provides the same interface but uses JavaScript instead of C++
// We can replace this with actual WebAssembly once compilation is working

class EntropyCalculatorJS {
  constructor() {
    this.wordsGuess = [];
    this.wordsAnswer = [];
  }

  setWordLists(guess, answer) {
    this.wordsGuess = guess;
    this.wordsAnswer = answer;
  }

  getPattern(guess, answer) {
    let pattern = 0;
    const used = new Array(answer.length).fill(false);

    // First pass: exact matches
    for (let i = 0; i < guess.length; i++) {
      if (guess[i] === answer[i]) {
        pattern += 2 * Math.pow(3, guess.length - 1 - i);
        used[i] = true;
      }
    }

    // Second pass: present but wrong position
    for (let i = 0; i < guess.length; i++) {
      if (guess[i] !== answer[i]) {
        for (let j = 0; j < answer.length; j++) {
          if (!used[j] && guess[i] === answer[j]) {
            pattern += 1 * Math.pow(3, guess.length - 1 - i);
            used[j] = true;
            break;
          }
        }
      }
    }

    return pattern;
  }

  calculateEntropy(guessWord) {
    const patternCounts = new Array(243).fill(0);

    for (const answer of this.wordsAnswer) {
      const pattern = this.getPattern(guessWord, answer);
      patternCounts[pattern]++;
    }

    let entropy = 0.0;
    const totalWords = this.wordsAnswer.length;

    for (const count of patternCounts) {
      if (count > 0) {
        const probability = count / totalWords;
        entropy -= probability * Math.log2(probability);
      }
    }

    return entropy;
  }
}

// Export for use in our application
if (typeof module !== "undefined" && module.exports) {
  module.exports = EntropyCalculatorJS;
} else if (typeof window !== "undefined") {
  window.EntropyCalculatorJS = EntropyCalculatorJS;
}
