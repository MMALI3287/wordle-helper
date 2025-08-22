// Demonstration of entropy calculations for Wordle
// This script shows how information theory works in practice

import { words } from './words';
import {
    calculateEntropy,
    getTopEntropyWords,
    getPattern,
    getBestStartingWords,
    explainEntropy
} from './entropy';

console.log('🧮 Wordle Entropy Analysis Demo\n');

// 1. Show the best starting words according to information theory
console.log('📊 Best Starting Words (Information Theory):');
const startingWords = getBestStartingWords();
startingWords.slice(0, 5).forEach((word, index) => {
    console.log(`${index + 1}. ${word.word} - ${word.description}`);
});

// 2. Calculate entropy for some example starting words
console.log('\n🔢 Entropy Calculations for Popular Starting Words:');
const testWords = ['SOARE', 'SLATE', 'ADIEU', 'RAISE', 'TRACE'];
testWords.forEach(word => {
    const entropy = calculateEntropy(word, words);
    console.log(`${word}: ${entropy.toFixed(2)} bits - ${explainEntropy(entropy)}`);
});

// 3. Show how entropy changes as constraints are added
console.log('\n🎯 How Entropy Changes with Constraints:');

// Simulate scenario: after guessing "SLATE" and getting pattern "BYGBY"
// This means: S=wrong, L=in word but wrong position, A=correct, T=wrong, E=in word but wrong position
const remainingAfterSlate = words.filter(word => {
    const pattern = getPattern('SLATE', word);
    return pattern === 'BYGBY'; // Example pattern
});

console.log(`After SLATE with pattern BYGBY: ${remainingAfterSlate.length} words remain`);

if (remainingAfterSlate.length > 0) {
    const topNextGuesses = getTopEntropyWords(words, remainingAfterSlate, 5);
    console.log('Top next guesses:');
    topNextGuesses.forEach((wordData, index) => {
        console.log(`${index + 1}. ${wordData.word}: ${wordData.bitsOfInfo} bits`);
    });
}

// 4. Demonstrate the pattern generation
console.log('\n🎨 Pattern Generation Examples:');
const examples = [
    { guess: 'SLATE', answer: 'ALERT', expected: 'BGYGY' },
    { guess: 'ADIEU', answer: 'AUDIO', expected: 'GBBGY' },
    { guess: 'CRANE', answer: 'TRAIN', expected: 'BGGYB' }
];

examples.forEach(({ guess, answer, expected }) => {
    const pattern = getPattern(guess, answer);
    console.log(`${guess} vs ${answer} → ${pattern} ${pattern === expected ? '✓' : '❌'}`);
});

// 5. Show information theory in action
console.log('\n💡 Information Theory Concepts:');
console.log('• 1 bit of information = cuts possibilities in half');
console.log('• 2 bits = reduces to 1/4 of original possibilities');
console.log('• 3 bits = reduces to 1/8 of original possibilities');
console.log('• Higher entropy = more information gained = better guess');
console.log('• Formula: H = -Σ p(x) × log₂(p(x))');

export { };