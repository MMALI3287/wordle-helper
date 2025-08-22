#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <vector>
#include <string>
#include <unordered_map>
#include <algorithm>
#include <cmath>
#include <iostream>

using namespace emscripten;

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
    EntropyCalculator() {}
    
    // Set word lists for calculations
    void setWordLists(const val& allWordsJS, const val& possibleAnswersJS) {
        allWords.clear();
        possibleAnswers.clear();
        
        // Convert JavaScript arrays to C++ vectors
        for (int i = 0; i < allWordsJS["length"].as<int>(); i++) {
            std::string word = allWordsJS[i].as<std::string>();
            std::transform(word.begin(), word.end(), word.begin(), ::toupper);
            allWords.push_back(word);
        }
        
        for (int i = 0; i < possibleAnswersJS["length"].as<int>(); i++) {
            std::string word = possibleAnswersJS[i].as<std::string>();
            std::transform(word.begin(), word.end(), word.begin(), ::toupper);
            possibleAnswers.push_back(word);
        }
        
        std::cout << "🔧 C++ EntropyCalculator initialized with " 
                  << allWords.size() << " total words and " 
                  << possibleAnswers.size() << " possible answers" << std::endl;
    }
    
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
    
    // Ultra-fast bulk entropy calculation for all words
    val calculateAllEntropies() {
        val results = val::array();
        
        if (possibleAnswers.empty()) {
            return results;
        }
        
        std::cout << "🚀 Starting C++ bulk entropy calculation for " 
                  << allWords.size() << " words..." << std::endl;
        
        // Calculate entropy for each word and create result objects
        std::vector<std::pair<double, std::string>> entropyPairs;
        entropyPairs.reserve(allWords.size());
        
        for (const std::string& word : allWords) {
            double entropy = calculateEntropy(word);
            entropyPairs.emplace_back(entropy, word);
        }
        
        // Sort by entropy (highest first) - much faster than JS sorting
        std::sort(entropyPairs.begin(), entropyPairs.end(), 
                  [](const auto& a, const auto& b) { return a.first > b.first; });
        
        // Convert to JavaScript format
        for (const auto& pair : entropyPairs) {
            val result = val::object();
            result.set("word", pair.second);
            result.set("entropy", pair.first);
            result.set("bitsOfInfo", std::round(pair.first * 100.0) / 100.0);
            results.call<void>("push", result);
        }
        
        std::cout << "✅ C++ bulk entropy calculation completed!" << std::endl;
        return results;
    }
    
    // Fast word filtering with constraints
    val filterWords(const val& wordsJS, 
                   const val& knownPositionsJS,
                   const val& yellowLettersJS, 
                   const val& grayLettersJS) {
        
        std::vector<std::string> words;
        std::vector<std::string> knownPositions;
        std::vector<std::string> grayLetters;
        
        // Convert JavaScript arrays to C++ vectors
        for (int i = 0; i < wordsJS["length"].as<int>(); i++) {
            std::string word = wordsJS[i].as<std::string>();
            std::transform(word.begin(), word.end(), word.begin(), ::toupper);
            words.push_back(word);
        }
        
        for (int i = 0; i < knownPositionsJS["length"].as<int>(); i++) {
            std::string pos = knownPositionsJS[i].as<std::string>();
            std::transform(pos.begin(), pos.end(), pos.begin(), ::toupper);
            knownPositions.push_back(pos);
        }
        
        for (int i = 0; i < grayLettersJS["length"].as<int>(); i++) {
            std::string letter = grayLettersJS[i].as<std::string>();
            std::transform(letter.begin(), letter.end(), letter.begin(), ::toupper);
            grayLetters.push_back(letter);
        }
        
        // Process yellow letters (more complex structure)
        std::vector<std::pair<char, std::vector<int>>> yellowLetters;
        for (int i = 0; i < yellowLettersJS["length"].as<int>(); i++) {
            val yellowItem = yellowLettersJS[i];
            char letter = yellowItem["letter"].as<std::string>()[0];
            letter = std::toupper(letter);
            
            std::vector<int> excludedPositions;
            val positions = yellowItem["excludedPositions"];
            for (int j = 0; j < positions["length"].as<int>(); j++) {
                excludedPositions.push_back(positions[j].as<int>());
            }
            yellowLetters.emplace_back(letter, excludedPositions);
        }
        
        // High-performance filtering
        std::vector<std::string> filtered;
        filtered.reserve(words.size() / 4); // Reserve space for efficiency
        
        for (const std::string& word : words) {
            bool valid = true;
            
            // Check known positions (green letters)
            for (size_t i = 0; i < knownPositions.size() && i < word.length(); i++) {
                if (!knownPositions[i].empty() && word[i] != knownPositions[i][0]) {
                    valid = false;
                    break;
                }
            }
            
            if (!valid) continue;
            
            // Check yellow letters
            for (const auto& yellow : yellowLetters) {
                char letter = yellow.first;
                const auto& excludedPositions = yellow.second;
                
                // Word must contain the letter
                if (word.find(letter) == std::string::npos) {
                    valid = false;
                    break;
                }
                
                // Letter must not be in excluded positions
                for (int pos : excludedPositions) {
                    if (pos < word.length() && word[pos] == letter) {
                        valid = false;
                        break;
                    }
                }
                if (!valid) break;
            }
            
            if (!valid) continue;
            
            // Check gray letters
            for (const std::string& grayLetter : grayLetters) {
                if (!grayLetter.empty() && word.find(grayLetter[0]) != std::string::npos) {
                    valid = false;
                    break;
                }
            }
            
            if (valid) {
                filtered.push_back(word);
            }
        }
        
        // Convert back to JavaScript array
        val result = val::array();
        for (const std::string& word : filtered) {
            result.call<void>("push", word);
        }
        
        return result;
    }
};

// Bind the class to JavaScript
EMSCRIPTEN_BINDINGS(entropy_calculator) {
    class_<EntropyCalculator>("EntropyCalculator")
        .constructor<>()
        .function("setWordLists", &EntropyCalculator::setWordLists)
        .function("calculateEntropy", &EntropyCalculator::calculateEntropy)
        .function("calculateAllEntropies", &EntropyCalculator::calculateAllEntropies)
        .function("filterWords", &EntropyCalculator::filterWords);
}