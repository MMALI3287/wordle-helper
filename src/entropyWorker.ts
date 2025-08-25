// Web Worker Interface for High-Performance Entropy Calculations
// Provides async communication with the optimized entropy worker

export class EntropyWorkerManager {
  private worker: Worker | null = null;
  private requestCounter = 0;
  private pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }>();

  constructor() {
    this.initializeWorker();
  }

  private initializeWorker() {
    try {
      // Try to load the TypeScript worker first, fallback to JS worker
      try {
        this.worker = new Worker(new URL('./entropyWorker.worker.ts', import.meta.url), {
          type: 'module'
        });
      } catch {
        // Fallback to JavaScript worker
        this.worker = new Worker('/entropyWorker.js');
      }
      
      this.worker.onmessage = (e) => {
        const { type, requestId, result, error } = e.data;
        
        const request = this.pendingRequests.get(requestId);
        if (!request) {
          return;
        }
        
        this.pendingRequests.delete(requestId);
        
        if (type === 'success') {
          request.resolve(result);
        } else if (type === 'error') {
          request.reject(new Error(error));
        }
      };
      
      this.worker.onerror = (error) => {
        // Reject all pending requests
        this.pendingRequests.forEach((request) => {
          request.reject(new Error('Worker error occurred'));
        });
        this.pendingRequests.clear();
      };
      
    } catch (error) {
      console.error('❌ Failed to initialize worker:', error);
    }
  }

  private sendMessage(type: string, data: any): Promise<any> {
    if (!this.worker) {
      return Promise.reject(new Error('Worker not initialized'));
    }

    const requestId = `req_${++this.requestCounter}`;
    
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });
      
      this.worker!.postMessage({
        type,
        data,
        requestId
      });
      
      // Add timeout to prevent hanging requests
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Worker request timeout'));
        }
      }, 30000); // 30 second timeout
    });
  }

  // Set word lists for calculations
  async setWordLists(allWords: string[], possibleAnswers: string[]): Promise<void> {
    return this.sendMessage('setWordLists', { allWords, possibleAnswers });
  }

  // Calculate entropy for a single word
  async calculateEntropy(word: string, possibleAnswers?: string[]): Promise<number> {
    return this.sendMessage('calculateEntropy', { word, possibleAnswers });
  }

  // Calculate entropy for all words (high-performance bulk operation)
  async calculateAllEntropies(allWords?: string[], possibleAnswers?: string[]): Promise<Array<{
    word: string;
    entropy: number;
    bitsOfInfo: number;
  }>> {
    return this.sendMessage('calculateAllEntropies', { allWords, possibleAnswers });
  }

  // Filter words based on constraints
  async filterWords(
    words: string[],
    knownPositions: string[],
    yellowLetters: Array<{ letter: string; excludedPositions: number[] }>,
    grayLetters: string[]
  ): Promise<string[]> {
    return this.sendMessage('filterWords', {
      words,
      knownPositions,
      yellowLetters,
      grayLetters
    });
  }

  // Terminate the worker
  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.pendingRequests.clear();
    }
  }

  // Check if worker is ready
  isReady(): boolean {
    return this.worker !== null;
  }
}

// Singleton instance for global use
export const entropyWorker = new EntropyWorkerManager();

// Export types for TypeScript
export interface EntropyResult {
  word: string;
  entropy: number;
  bitsOfInfo: number;
}

export interface WordConstraints {
  knownPositions: string[];
  yellowLetters: Array<{ letter: string; excludedPositions: number[] }>;
  grayLetters: string[];
}