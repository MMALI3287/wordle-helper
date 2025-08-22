// Entropy and Information Theory utilities for Wordle
// Based on information theory principles where entropy measures expected information gain

export type LetterResult = 'B' | 'Y' | 'G'; // Black, Yellow, Green
export type Pattern = string; // e.g., "BGYBB"

/**
 * Generates the pattern (response) when guessing a word against a target word
 * B = Black (letter not in word)
 * Y = Yellow (letter in word, wrong position) 
 * G = Green (letter in word, correct position)
 */
export function getPattern(guess: string, target: string): Pattern {
    const guessLetters = guess.toUpperCase().split('');
    const targetLetters = target.toUpperCase().split('');
    const result: LetterResult[] = new Array(5).fill('B');

    // Create a frequency map of target letters for yellow/black logic
    const targetFreq: { [key: string]: number } = {};
    for (const letter of targetLetters) {
        targetFreq[letter] = (targetFreq[letter] || 0) + 1;
    }

    // First pass: mark green letters and reduce frequency
    for (let i = 0; i < 5; i++) {
        if (guessLetters[i] === targetLetters[i]) {
            result[i] = 'G';
            targetFreq[guessLetters[i]]--;
        }
    }

    // Second pass: mark yellow letters
    for (let i = 0; i < 5; i++) {
        if (result[i] === 'B' && targetFreq[guessLetters[i]] > 0) {
            result[i] = 'Y';
            targetFreq[guessLetters[i]]--;
        }
    }

    return result.join('');
}

/**
 * Checks if a word matches the given constraints
 */
export function matchesConstraints(
    word: string,
    knownPositions: string[],
    yellowLetters: Array<{ letter: string, excludedPositions: number[] }>,
    grayLetters: string[]
): boolean {
    const upperWord = word.toUpperCase();

    // Check known positions (green constraints)
    for (let i = 0; i < knownPositions.length; i++) {
        if (knownPositions[i] && upperWord[i] !== knownPositions[i]) {
            return false;
        }
    }

    // Check yellow letters (must be in word but not in excluded positions)
    for (const yellowInfo of yellowLetters) {
        const letter = yellowInfo.letter;

        // Letter must be present in the word
        if (!upperWord.includes(letter)) {
            return false;
        }

        // Letter must not be in any of the excluded positions
        for (const excludedPos of yellowInfo.excludedPositions) {
            if (excludedPos < upperWord.length && upperWord[excludedPos] === letter) {
                return false;
            }
        }
    }

    // Check gray letters (must not be in word)
    for (const letter of grayLetters) {
        if (upperWord.includes(letter)) {
            return false;
        }
    }

    return true;
}

/**
 * Calculates the entropy (expected information gain) for a guess word
 * Higher entropy = better guess (more information gained on average)
 */
export function calculateEntropy(guessWord: string, possibleAnswers: string[]): number {
    if (possibleAnswers.length <= 1) {
        return 0;
    }

    // Count frequency of each pattern that could result from this guess
    const patternCounts: { [pattern: string]: number } = {};

    for (const answer of possibleAnswers) {
        const pattern = getPattern(guessWord, answer);
        patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
    }

    // Calculate entropy using Shannon's formula: H = -Σ p(x) * log₂(p(x))
    let entropy = 0;
    const totalAnswers = possibleAnswers.length;

    for (const count of Object.values(patternCounts)) {
        const probability = count / totalAnswers;
        entropy -= probability * Math.log2(probability);
    }

    return entropy;
}

/**
 * Calculates entropy for all words and returns them sorted by entropy (highest first)
 */
export function calculateAllEntropies(
    guessWords: string[],
    possibleAnswers: string[]
): Array<{ word: string; entropy: number; bitsOfInfo: number }> {
    const results = guessWords.map(word => {
        const entropy = calculateEntropy(word, possibleAnswers);
        return {
            word: word.toUpperCase(),
            entropy,
            bitsOfInfo: Number(entropy.toFixed(2))
        };
    });

    // Sort by entropy (highest first)
    return results.sort((a, b) => b.entropy - a.entropy);
}

/**
 * Gets the top N words with highest entropy
 */
export function getTopEntropyWords(
    guessWords: string[],
    possibleAnswers: string[],
    topN: number = 10
): Array<{ word: string; entropy: number; bitsOfInfo: number }> {
    const allEntropies = calculateAllEntropies(guessWords, possibleAnswers);
    return allEntropies.slice(0, topN);
}

/**
 * Calculates expected remaining possibilities after making a guess
 * This is an alternative metric to entropy - lower is better
 */
export function calculateExpectedRemainingWords(guessWord: string, possibleAnswers: string[]): number {
    if (possibleAnswers.length <= 1) {
        return 0;
    }

    const patternCounts: { [pattern: string]: number } = {};

    for (const answer of possibleAnswers) {
        const pattern = getPattern(guessWord, answer);
        patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
    }

    // Calculate weighted average of remaining words
    let weightedSum = 0;
    const totalAnswers = possibleAnswers.length;

    for (const count of Object.values(patternCounts)) {
        const probability = count / totalAnswers;
        weightedSum += probability * count;
    }

    return weightedSum;
}

/**
 * Provides a human-readable explanation of entropy
 */
export function explainEntropy(entropy: number): string {
    if (entropy === 0) {
        return "No information gain - only one possibility remains";
    } else if (entropy < 1) {
        return "Low information gain - eliminates few possibilities";
    } else if (entropy < 2) {
        return "Moderate information gain - roughly halves possibilities";
    } else if (entropy < 3) {
        return "Good information gain - reduces possibilities significantly";
    } else if (entropy < 4) {
        return "High information gain - eliminates many possibilities";
    } else {
        return "Excellent information gain - maximum uncertainty reduction";
    }
}

/**
 * Suggests the best starting words based on entropy
 * These are commonly known optimal starting words
 */
export function getBestStartingWords(): Array<{ word: string; description: string }> {
    return [
        { word: "SOARE", description: "Highest entropy starting word (5.89 bits)" },
        { word: "SLATE", description: "Popular high-entropy choice (5.84 bits)" },
        { word: "TRACE", description: "Excellent common-word choice (5.81 bits)" },
        { word: "CRATE", description: "High entropy with common letters (5.78 bits)" },
        { word: "ADIEU", description: "Vowel-heavy strategy (5.76 bits)" },
        { word: "AUDIO", description: "Another vowel-focused option (5.74 bits)" },
        { word: "RAISE", description: "Balanced consonant-vowel mix (5.72 bits)" }
    ];
}