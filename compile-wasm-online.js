// Online WebAssembly compilation script using Compiler Explorer API
const fs = require("fs");
const path = require("path");
const https = require("https");

const entropyCode = `
#include <vector>
#include <string>
#include <unordered_map>
#include <algorithm>
#include <cmath>

class EntropyCalculator {
private:
    std::vector<std::string> allWords;
    std::vector<std::string> possibleAnswers;
    
    // High-performance pattern generation
    std::string getPattern(const std::string& guess, const std::string& target) {
        std::string result(guess.length(), 'B'); // Initialize as all black
        std::vector<int> targetFreq(26, 0);
        
        // Count target letter frequencies
        for (char c : target) {
            targetFreq[c - 'A']++;
        }
        
        // First pass: mark green letters and reduce frequency
        for (size_t i = 0; i < guess.length(); i++) {
            if (guess[i] == target[i]) {
                result[i] = 'G';
                targetFreq[guess[i] - 'A']--;
            }
        }
        
        // Second pass: mark yellow letters
        for (size_t i = 0; i < guess.length(); i++) {
            if (result[i] == 'B' && targetFreq[guess[i] - 'A'] > 0) {
                result[i] = 'Y';
                targetFreq[guess[i] - 'A']--;
            }
        }
        
        return result;
    }

public:
    // High-performance entropy calculation
    double calculateEntropy(const std::string& guessWord) {
        if (possibleAnswers.size() <= 1) {
            return 0.0;
        }
        
        std::string upperGuess = guessWord;
        std::transform(upperGuess.begin(), upperGuess.end(), upperGuess.begin(), ::toupper);
        
        // Count pattern frequencies using unordered_map for O(1) lookups
        std::unordered_map<std::string, int> patternCounts;
        
        for (const std::string& answer : possibleAnswers) {
            std::string pattern = getPattern(upperGuess, answer);
            patternCounts[pattern]++;
        }
        
        // Calculate Shannon entropy: H = -Σ p(x) * log₂(p(x))
        double entropy = 0.0;
        double totalAnswers = static_cast<double>(possibleAnswers.size());
        
        for (const auto& pair : patternCounts) {
            double probability = pair.second / totalAnswers;
            entropy -= probability * std::log2(probability);
        }
        
        return entropy;
    }
};

extern "C" {
    double calculate_entropy_c(const char* word) {
        EntropyCalculator calc;
        std::string str(word);
        return calc.calculateEntropy(str);
    }
}
`;

console.log(
  "🔧 C++ entropy calculator code prepared for WebAssembly compilation"
);
console.log("📝 Code length:", entropyCode.length, "characters");

// For now, we'll create the C++ file locally and provide instructions
fs.writeFileSync(
  "d:\\Projects\\wordle-helper\\entropy-compiled.cpp",
  entropyCode
);

console.log("✅ Created entropy-compiled.cpp");
console.log(
  "🌐 Use Compiler Explorer at https://godbolt.org/ to compile to WebAssembly"
);
console.log(
  '📋 Use these compiler options: -O3 -s WASM=1 -s EXPORTED_FUNCTIONS=\'["_calculate_entropy_c"]\' -s EXPORTED_RUNTIME_METHODS=\'["ccall","cwrap"]\''
);
