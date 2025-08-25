// High-Performance Entropy Calculation Web Worker
// Optimized JavaScript implementation for maximum compatibility

class OptimizedEntropyCalculator {
  constructor() {
    this.allWords = [];
    this.possibleAnswers = [];
  }

  // Ultra-fast pattern generation with bit manipulation
  getPattern(guess, target) {
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

  // Optimized entropy calculation with Map for O(1) lookups
  calculateEntropy(guessWord, possibleAnswers) {
    if (!possibleAnswers) possibleAnswers = this.possibleAnswers;
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
    
    // Convert Map values to array for compatibility
    const counts = Array.from(patternCounts.values());
    for (let i = 0; i < counts.length; i++) {
      const count = counts[i];
      const probability = count / totalAnswers;
      entropy -= probability * (Math.log(probability) / log2);
    }
    
    return entropy;
  }

  // Lightning-fast bulk entropy calculation
  calculateAllEntropies(allWords, possibleAnswers) {
    if (!allWords) allWords = this.allWords;
    if (!possibleAnswers) possibleAnswers = this.possibleAnswers;
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
    results.sort(function(a, b) { return b.entropy - a.entropy; });
    
    return results;
  }

  // High-speed word filtering with early termination
  filterWords(words, knownPositions, yellowLetters, grayLetters) {
    const filtered = [];
    const graySet = new Set();
    
    // Convert gray letters to uppercase and add to set
    for (let i = 0; i < grayLetters.length; i++) {
      graySet.add(grayLetters[i].toUpperCase());
    }
    
    // Pre-process yellow letters for faster lookup
    const yellowConstraints = [];
    for (let i = 0; i < yellowLetters.length; i++) {
      const y = yellowLetters[i];
      yellowConstraints.push({
        letter: y.letter.toUpperCase(),
        excludedPositions: y.excludedPositions
      });
    }
    
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
      for (let j = 0; j < yellowConstraints.length; j++) {
        const yellow = yellowConstraints[j];
        
        // Word must contain the letter
        if (word.indexOf(yellow.letter) === -1) {
          continue wordLoop;
        }
        
        // Letter must not be in excluded positions
        for (let k = 0; k < yellow.excludedPositions.length; k++) {
          const pos = yellow.excludedPositions[k];
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
    this.allWords = [];
    this.possibleAnswers = [];
    
    // Convert to uppercase
    for (let i = 0; i < allWords.length; i++) {
      this.allWords.push(allWords[i].toUpperCase());
    }
    for (let i = 0; i < possibleAnswers.length; i++) {
      this.possibleAnswers.push(possibleAnswers[i].toUpperCase());
    }
  }
}

// Global calculator instance
const calculator = new OptimizedEntropyCalculator();

// Web Worker message handler - using traditional function declaration for compatibility
onmessage = function(e) {
  const messageData = e.data;
  const type = messageData.type;
  const data = messageData.data;
  const requestId = messageData.requestId;
  
  try {
    let result;
    
    if (type === 'setWordLists') {
      calculator.setWordLists(data.allWords, data.possibleAnswers);
      result = { success: true };
    } else if (type === 'calculateEntropy') {
      result = calculator.calculateEntropy(data.word, data.possibleAnswers);
    } else if (type === 'calculateAllEntropies') {
      result = calculator.calculateAllEntropies(data.allWords, data.possibleAnswers);
    } else if (type === 'filterWords') {
      result = calculator.filterWords(
        data.words, 
        data.knownPositions, 
        data.yellowLetters, 
        data.grayLetters
      );
    } else {
      throw new Error('Unknown message type: ' + type);
    }
    
    // Send success response
    postMessage({
      type: 'success',
      requestId: requestId,
      result: result
    });
    
  } catch (error) {
    // Send error response
    postMessage({
      type: 'error',
      requestId: requestId,
      error: error.message
    });
  }
};