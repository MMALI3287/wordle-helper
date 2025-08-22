// Asynchronous word calculation worker
import { matchesConstraints, getTopEntropyWords } from './entropy';
import { getWordsForLength } from './dictionaryAPI';

interface CalculationRequest {
  knownPositions: string[];
  yellowLetters: Array<{letter: string, excludedPositions: number[]}>;
  grayLetters: string[];
  wordLength: number;
  requestId: string;
}

interface CalculationResult {
  filteredWords: string[];
  strategicWords: Array<{ word: string; entropy: number; bitsOfInfo: number }>;
  possibleAnswers: Array<{ word: string; entropy: number; bitsOfInfo: number }>;
  isGameWon: boolean;
  requestId: string;
}

class WordCalculator {
  private isCalculating = false;
  private pendingRequest: CalculationRequest | null = null;
  private lastResult: CalculationResult | null = null;

  async calculateWords(request: CalculationRequest): Promise<CalculationResult> {
    // If we're already calculating, store the new request and return the last result
    if (this.isCalculating) {
      this.pendingRequest = request;
      return this.lastResult || this.getEmptyResult(request.requestId);
    }

    this.isCalculating = true;

    try {
      const result = await this.performCalculation(request);
      this.lastResult = result;

      // If there's a pending request, process it
      if (this.pendingRequest) {
        const nextRequest = this.pendingRequest;
        this.pendingRequest = null;
        
        // Use setTimeout to allow the UI to update before starting the next calculation
        setTimeout(() => {
          this.isCalculating = false;
          this.calculateWords(nextRequest);
        }, 10);
      } else {
        this.isCalculating = false;
      }

      return result;
    } catch (error) {
      this.isCalculating = false;
      throw error;
    }
  }

  private async performCalculation(request: CalculationRequest): Promise<CalculationResult> {
    const { knownPositions, yellowLetters, grayLetters, wordLength, requestId } = request;

    // Get all words for the specified length
    const allWords = await getWordsForLength(wordLength);
    
    // Filter words based on constraints
    const filteredWords = allWords.filter((word: string) => 
      matchesConstraints(word, knownPositions, yellowLetters, grayLetters)
    );
    
    // Check if game is won
    const isGameWon = filteredWords.length === 1;
    
    // Get strategic words and possible answers
    const strategicWords = getTopEntropyWords(allWords, filteredWords, 10);
    const possibleAnswers = getTopEntropyWords(filteredWords, filteredWords, 20);

    return {
      filteredWords,
      strategicWords,
      possibleAnswers,
      isGameWon,
      requestId
    };
  }

  private getEmptyResult(requestId: string): CalculationResult {
    return {
      filteredWords: [],
      strategicWords: [],
      possibleAnswers: [],
      isGameWon: false,
      requestId
    };
  }

  isCurrentlyCalculating(): boolean {
    return this.isCalculating;
  }
}

export const wordCalculator = new WordCalculator();
export type { CalculationRequest, CalculationResult };