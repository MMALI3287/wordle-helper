#include <cmath>
#include <vector>
#include <string>

// Simple C-compatible exports for WebAssembly
extern "C"
{

    // Calculate entropy given pattern counts
    double calculate_entropy(int *patterns, int pattern_count, int total_words)
    {
        double entropy = 0.0;

        for (int i = 0; i < pattern_count; i++)
        {
            if (patterns[i] > 0)
            {
                double probability = (double)patterns[i] / total_words;
                entropy -= probability * log2(probability);
            }
        }

        return entropy;
    }

    // Get pattern for guess vs answer
    int get_pattern(const char *guess, const char *answer, int word_length)
    {
        int pattern = 0;
        bool used[10] = {false}; // Support up to 10-letter words

        // First pass: exact matches
        for (int i = 0; i < word_length; i++)
        {
            if (guess[i] == answer[i])
            {
                pattern += 2 * pow(3, word_length - 1 - i);
                used[i] = true;
            }
        }

        // Second pass: present but wrong position
        for (int i = 0; i < word_length; i++)
        {
            if (guess[i] != answer[i])
            {
                for (int j = 0; j < word_length; j++)
                {
                    if (!used[j] && guess[i] == answer[j])
                    {
                        pattern += 1 * pow(3, word_length - 1 - i);
                        used[j] = true;
                        break;
                    }
                }
            }
        }

        return pattern;
    }

    // Test function to verify compilation
    int test_add(int a, int b)
    {
        return a + b;
    }
}