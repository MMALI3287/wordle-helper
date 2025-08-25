// Web Worker Interface for High-Performance Entropy Calculations
// Provides async communication with the optimized entropy worker

export class EntropyWorkerManager {
  private worker: Worker | null = null;
  private requestCounter = 0;
  private pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }>();
  private workerReady = false;
  private readyPromise: Promise<void> | null = null;

  constructor() {
    this.initializeWorker();
  }

  private initializeWorker() {
    this.readyPromise = new Promise<void>((resolve, reject) => {
      try {
        // Load the optimized JavaScript worker from public folder
        this.worker = new Worker('/entropyWorker-optimized.js');

        this.worker.onmessage = (e) => {
          const { type, requestId, result, error } = e.data;

          // Handle worker ready signal
          if (type === 'ready') {
            this.workerReady = true;
            resolve();
            return;
          }

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
          console.error('❌ Worker error:', error);
          this.workerReady = false;
          reject(error);

          // Reject all pending requests
          this.pendingRequests.forEach((request) => {
            request.reject(new Error('Worker error occurred'));
          });
          this.pendingRequests.clear();
        };

        // Send ready check message to worker
        this.worker.postMessage({ type: 'ready' });

      } catch (error) {
        console.error('❌ Failed to initialize worker:', error);
        this.workerReady = false;
        reject(error);
      }
    });
  }

  private async sendMessage(type: string, data: any): Promise<any> {
    // Wait for worker to be ready
    if (!this.workerReady && this.readyPromise) {
      await this.readyPromise;
    }

    if (!this.worker || !this.workerReady) {
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

  // Cancel all pending calculations and clear pending requests
  cancelAll() {
    // Reject all pending requests with cancellation error
    this.pendingRequests.forEach((request) => {
      request.reject(new Error('Calculation cancelled'));
    });
    this.pendingRequests.clear();

    // Terminate and recreate worker to stop any ongoing calculations
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.workerReady = false;
      this.initializeWorker();
    }
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
    return this.worker !== null && this.workerReady;
  }

  // Get ready promise for async waiting
  async waitForReady(): Promise<void> {
    if (this.workerReady) return;
    if (this.readyPromise) {
      await this.readyPromise;
    }
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