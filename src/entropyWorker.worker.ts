// High-Performance Entropy Calculation Web Worker
// TypeScript Web Worker with proper typing

/// <reference lib="webworker" />

declare const self: DedicatedWorkerGlobalScope;

interface WorkerMessage {
  type: string;
  data: any;
  requestId: string;
}

interface WorkerResponse {
  type: 'success' | 'error';
  requestId: string;
  result?: any;
  error?: string;
}

class OptimizedEntropyCalculator {
  private allWords: string[] = [];
  private possibleAnswers: string[] = [];

  // Ultra-fast pattern generation with bit manipulation and better error handling
  getPattern(guess: string, target: string): string {
    if (!guess || !target || guess.length !== target.length) {
      return '';
    }
    
    const result = new Array(guess.length).fill('B');
    const targetFreq = new Array(26).fill(0);
    
    // Count target letter frequencies using char codes for speed
    for (let i = 0; i < target.length; i++) {
      targetFreq[target.charCodeAt(i) - 65]++;
    }
    
    // First pass: mark green letters and reduce frequency
    for (let i = 0; i < guess.length; i++) {
      if (guess[i] === target[i]) {
        result[i] = 'G';
        targetFreq[guess.charCodeAt(i) - 65]--;
      }
    }
    
    // Second pass: mark yellow letters
    for (let i = 0; i < guess.length; i++) {
      if (result[i] === 'B') {
        const charIndex = guess.charCodeAt(i) - 65;
        if (targetFreq[charIndex] > 0) {
          result[i] = 'Y';
          targetFreq[charIndex]--;
        }
      }
    }
    
    return result.join('');
  }

  // Optimized entropy calculation with validation
  calculateEntropy(guessWord: string, possibleAnswers = this.possibleAnswers): number {
    if (!guessWord || typeof guessWord !== 'string') return 0;
    if (!Array.isArray(possibleAnswers) || possibleAnswers.length <= 1) return 0;
    
    const patternCounts = new Map<string, number>();
    const upperGuess = guessWord.toUpperCase();
    
    // Use for-loop instead of forEach for better performance
    for (let i = 0; i < possibleAnswers.length; i++) {
      const pattern = this.getPattern(upperGuess, possibleAnswers[i]);
      if (pattern) { // Only process valid patterns
        patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1);
      }
    }
    
    // Calculate Shannon entropy with optimized math
    let entropy = 0;
    const totalAnswers = possibleAnswers.length;
    const log2 = Math.log(2);
    
    // Use forEach instead of for...of for compatibility
    patternCounts.forEach((count) => {
      const probability = count / totalAnswers;
      entropy -= probability * (Math.log(probability) / log2);
    });
    
    return entropy;
  }

  // Lightning-fast bulk entropy calculation
  calculateAllEntropies(allWords = this.allWords, possibleAnswers = this.possibleAnswers) {
    if (possibleAnswers.length === 0) return [];
    
    // Pre-allocate results array for better memory performance
    const results = new Array(allWords.length);
    
    // Use traditional for-loop for maximum performance
    for (let i = 0; i < allWords.length; i++) {
      const entropy = this.calculateEntropy(allWords[i], possibleAnswers);
      results[i] = {
        word: allWords[i],
        entropy: entropy,
        bitsOfInfo: Math.round(entropy * 100) / 100
      };
    }
    
    // Native sort is optimized in modern JS engines
    results.sort((a, b) => b.entropy - a.entropy);
    
    return results;
  }

  // High-speed word filtering with early termination
  filterWords(
    words: string[], 
    knownPositions: string[], 
    yellowLetters: Array<{ letter: string; excludedPositions: number[] }>, 
    grayLetters: string[]
  ): string[] {
    const filtered: string[] = [];
    const graySet = new Set(grayLetters.map(l => l.toUpperCase()));
    
    // Pre-process yellow letters for faster lookup
    const yellowConstraints = yellowLetters.map(y => ({
      letter: y.letter.toUpperCase(),
      excludedSet: new Set(y.excludedPositions)
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
      let skipWord = false;
      for (const yellow of yellowConstraints) {
        // Word must contain the letter
        if (!word.includes(yellow.letter)) {
          skipWord = true;
          break;
        }
        
        // Letter must not be in excluded positions
        const excludedPositions = Array.from(yellow.excludedSet);
        for (let k = 0; k < excludedPositions.length; k++) {
          if (word[excludedPositions[k]] === yellow.letter) {
            skipWord = true;
            break;
          }
        }
        
        if (skipWord) break;
      }
      
      if (skipWord) continue;
      
      filtered.push(words[i]); // Keep original case
    }
    
    return filtered;
  }

  // Set word lists for calculations with validation
  setWordLists(allWords: string[], possibleAnswers: string[]): void {
    if (!Array.isArray(allWords) || !Array.isArray(possibleAnswers)) {
      throw new Error('Invalid word lists provided');
    }
    
    this.allWords = allWords
      .filter(word => typeof word === 'string' && word.length > 0)
      .map(w => w.toUpperCase());
    this.possibleAnswers = possibleAnswers
      .filter(word => typeof word === 'string' && word.length > 0)
      .map(w => w.toUpperCase());
  }
}

// Global calculator instance
const calculator = new OptimizedEntropyCalculator();

// Web Worker message handler with proper typing
self.onmessage = function(e: MessageEvent<WorkerMessage>) {
  const { type, data, requestId } = e.data;
  
  try {
    let result: any;
    
    switch (type) {
      case 'setWordLists':
        calculator.setWordLists(data.allWords, data.possibleAnswers);
        result = { success: true };
        break;
        
      case 'calculateEntropy':
        result = calculator.calculateEntropy(data.word, data.possibleAnswers);
        break;
        
      case 'calculateAllEntropies':
        result = calculator.calculateAllEntropies(data.allWords, data.possibleAnswers);
        break;
        
      case 'filterWords':
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
    const response: WorkerResponse = {
      type: 'success',
      requestId,
      result
    };
    self.postMessage(response);
    
  } catch (error: any) {
    console.error('❌ Worker error:', error);
    
    // Send error response
    const response: WorkerResponse = {
      type: 'error',
      requestId,
      error: error.message
    };
    self.postMessage(response);
  }
};

export {}; // Make this a module