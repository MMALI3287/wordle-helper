import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { getBestStartingWords } from './bestStartingWords';
import { entropyWorker, EntropyResult } from './entropyWorker';
import './App.css';

// Consolidated word loading system with memory management
const wordCache = new Map<number, string[]>();
const loadingStates = new Map<number, Promise<string[]>>();

// Memory cleanup function
const cleanupWordCache = () => {
  // Keep only the 3 most recently used word lengths to prevent memory bloat
  if (wordCache.size > 3) {
    const entries = Array.from(wordCache.entries());
    entries.sort((a, b) => a[0] - b[0]); // Sort by word length
    const toRemove = entries.slice(0, entries.length - 3);
    toRemove.forEach(([length]) => wordCache.delete(length));
  }
};

const loadWordsForLength = async (length: number): Promise<string[]> => {
  // Return cached words if available
  if (wordCache.has(length)) {
    return wordCache.get(length)!;
  }

  // Return existing loading promise if already loading
  if (loadingStates.has(length)) {
    return loadingStates.get(length)!;
  }

  // Start new loading process with performance optimizations
  const loadPromise = (async () => {
    try {
      // Fetch with compression and timeout optimizations
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`/words_${length}_letters.json`, {
        headers: {
          'Accept-Encoding': 'gzip, deflate, br', // Request compression
          'Cache-Control': 'max-age=3600' // Cache for 1 hour
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to load ${length}-letter words: ${response.statusText}`);
      }
      
      // Parse JSON
      const words: string[] = await response.json();
      
      wordCache.set(length, words);
      loadingStates.delete(length); // Clean up loading state
      
      // Cleanup old entries to prevent memory leaks
      cleanupWordCache();
      
      return words;
    } catch (error) {
      console.error(`❌ Error loading ${length}-letter words:`, error);
      loadingStates.delete(length); // Clean up loading state
      return [];
    }
  })();

  loadingStates.set(length, loadPromise);
  return loadPromise;
};

// Optimized word filtering with improved duplicate letter handling
const filterWords = (
  words: string[],
  knownPositions: string[],
  yellowLetters: Array<{ letter: string; excludedPositions: number[] }>,
  grayLetters: string[]
): string[] => {
  return words.filter(word => {
    const upperWord = word.toUpperCase();

    // Check if word matches known positions (green letters)
    for (let i = 0; i < knownPositions.length; i++) {
      if (knownPositions[i] && upperWord[i] !== knownPositions[i]) {
        return false;
      }
    }

    // Check if word contains gray letters
    for (const grayLetter of grayLetters) {
      if (upperWord.includes(grayLetter.toUpperCase())) {
        return false;
      }
    }

    // Check yellow letters with improved duplicate handling
    for (const { letter, excludedPositions } of yellowLetters) {
      const upperLetter = letter.toUpperCase();

      // Word must contain the letter
      if (!upperWord.includes(upperLetter)) {
        return false;
      }

      // Letter must not be in any of the excluded positions
      for (const position of excludedPositions) {
        if (position < upperWord.length && upperWord[position] === upperLetter) {
          return false;
        }
      }
    }

    return true;
  });
};

const ITEM_TYPE = 'LETTER';

interface LetterCardProps {
  letter: string;
  backgroundColor?: string;
  textColor?: string;
  isInSource?: boolean;
  onRemove?: () => void;
}

function LetterCard({ letter, backgroundColor = 'bg-slate-700/50 backdrop-blur-sm', textColor = 'text-slate-200', isInSource = false, onRemove }: LetterCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ITEM_TYPE,
    item: { letter },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag as any}
      className={`
        w-12 h-12 flex items-center justify-center text-lg font-black border-2 border-white/20 rounded-2xl cursor-move shadow-lg
        ${backgroundColor} ${textColor}
        ${isDragging ? 'opacity-30 scale-110 rotate-12' : 'opacity-100 scale-100 rotate-0'}
        ${!isInSource ? 'hover:shadow-2xl hover:scale-110 hover:-rotate-3' : 'hover:scale-105 hover:shadow-xl'}
        transition-all duration-300 ease-out relative overflow-hidden group
      `}
      onClick={!isInSource && onRemove ? onRemove : undefined}
    >
      {/* Glowing border effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>

      {/* Letter with subtle glow */}
      <span className="relative z-10 drop-shadow-lg group-hover:drop-shadow-2xl transition-all duration-300">
        {letter}
      </span>

      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 -top-full bg-gradient-to-b from-transparent via-white/20 to-transparent skew-y-12 group-hover:top-full transition-all duration-700 ease-out"></div>
    </div>
  );
}

interface DropZoneProps {
  onDrop: (letter: string, sourcePosition?: number) => void;
  children: React.ReactNode;
  position?: number; // For tracking where the letter came from
}

function DropZone({ onDrop, children, position }: DropZoneProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ITEM_TYPE,
    drop: (item: { letter: string }) => onDrop(item.letter, position),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div ref={drop as any} className={`transition-all duration-300 ${isOver ? 'scale-105 brightness-110' : ''}`}>
      {children}
    </div>
  );
}

function App() {
  const [wordLength, setWordLength] = useState<number>(5);
  const [words, setWords] = useState<string[]>([]);
  const [wordsLoadingStatus, setWordsLoadingStatus] = useState<string>('');
  const [knownPositions, setKnownPositions] = useState<string[]>(new Array(wordLength).fill(''));
  const [yellowLetters, setYellowLetters] = useState<Array<{ letter: string, excludedPositions: number[] }>>([]);
  const [grayLetters, setGrayLetters] = useState<string[]>([]);

  // New state for Web Worker integration
  const [entropyResults, setEntropyResults] = useState<EntropyResult[]>([]);
  const [isCalculatingEntropy, setIsCalculatingEntropy] = useState(false);



  // Animation states for interaction-based animations only
  const [animatingLetters, setAnimatingLetters] = useState<Set<string>>(new Set());

  // Combined calculating state for the indicator
  const isCalculating = isCalculatingEntropy;

  // Load words when word length changes with improved error handling
  useEffect(() => {
    const loadWords = async () => {
      setWordsLoadingStatus(`Loading ${wordLength}-letter words...`);

      try {
        // Start loading words in background - UI remains interactive
        const newWords = await loadWordsForLength(wordLength);
        
        // Validate loaded words
        if (!Array.isArray(newWords) || newWords.length === 0) {
          throw new Error(`No words found for length ${wordLength}`);
        }
        
        setWords(newWords);
        setWordsLoadingStatus('');

        // Initialize worker with word list for entropy calculations (when needed)
        if (newWords.length > 0) {
          try {
            await entropyWorker.setWordLists(newWords, newWords);
          } catch (workerError) {
            console.warn('Worker initialization failed, entropy calculations will be disabled:', workerError);
          }
        }

      } catch (error) {
        console.error('❌ Error loading words:', error);
        setWords([]);
        setWordsLoadingStatus(`Failed to load ${wordLength}-letter words. Please try again.`);
      }
    };

    loadWords();
    setKnownPositions(new Array(wordLength).fill(''));
  }, [wordLength]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup worker when component unmounts
      entropyWorker.terminate();
    };
  }, []);  // Simple word filtering - instant results
  const filteredWords = useMemo(() => {
    const result = filterWords(words, knownPositions, yellowLetters, grayLetters);
    return result;
  }, [words, knownPositions, yellowLetters, grayLetters]);

  // Calculate entropy-sorted suggestions using Web Worker - ONLY when user has constraints
  useEffect(() => {
    const calculateEntropyAsync = async () => {
      // Only calculate if we have constraints (user has started guessing)
      const hasConstraints = knownPositions.some(pos => pos !== '') ||
        yellowLetters.length > 0 ||
        grayLetters.length > 0;

      if (!hasConstraints) {
        // No constraints = show starting words, no entropy calculation needed
        setEntropyResults([]);
        setIsCalculatingEntropy(false);
        return;
      }

      if (words.length === 0 || filteredWords.length === 0) {
        setEntropyResults([]);
        setIsCalculatingEntropy(false);
        return;
      }

      try {
        setIsCalculatingEntropy(true);

        // Use filtered words as possible answers and calculate entropy for all words
        const possibleAnswers = filteredWords.length > 0 ? filteredWords : words;
        
        // Validate inputs before sending to worker
        if (!Array.isArray(words) || words.length === 0 || 
            !Array.isArray(possibleAnswers) || possibleAnswers.length === 0) {
          setEntropyResults([]);
          return;
        }
        
        // Send word lists to worker
        await entropyWorker.setWordLists(words, possibleAnswers);
        
        // Calculate entropy for all words with timeout
        const results = await Promise.race([
          entropyWorker.calculateAllEntropies(words, possibleAnswers),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Entropy calculation timeout')), 60000)
          )
        ]);
        
        // Validate results
        if (Array.isArray(results) && results.length > 0) {
          setEntropyResults(results.slice(0, 20));
        } else {
          setEntropyResults([]);
        }
        
      } catch (error) {
        console.error('❌ Error in Web Worker entropy calculation:', error);
        setEntropyResults([]);
        // Could implement fallback calculation here if needed
      } finally {
        setIsCalculatingEntropy(false);
      }
    };

    // Debounce calculations to avoid excessive computation
    const timeoutId = setTimeout(calculateEntropyAsync, 300);
    
    return () => clearTimeout(timeoutId);
  }, [words, filteredWords, knownPositions, yellowLetters, grayLetters]);

  // Simple game state
  const isGameWon = filteredWords.length === 1;

  // Get starting word suggestions - ALWAYS show when no constraints
  const startingWordSuggestions = useMemo(() => {
    const hasConstraints = knownPositions.some(pos => pos !== '') ||
      yellowLetters.length > 0 ||
      grayLetters.length > 0;

    // Only show starting words when there are no constraints
    if (hasConstraints) {
      return [];
    }

    // Get pre-computed starting words for current word length
    return getBestStartingWords(wordLength);
  }, [wordLength, knownPositions, yellowLetters, grayLetters]);

  // Enhanced animation helpers for interaction-based animations
  const triggerLetterAnimation = (letterKey: string) => {
    setAnimatingLetters(prev => new Set(prev).add(letterKey));
    setTimeout(() => {
      setAnimatingLetters(prev => {
        const newSet = new Set(prev);
        newSet.delete(letterKey);
        return newSet;
      });
    }, 600);
  };

  const addToYellow = useCallback((letter: string, sourcePosition?: number) => {
    // Validate input
    if (!letter || typeof letter !== 'string' || letter.length !== 1) {
      return;
    }
    
    const upperLetter = letter.toUpperCase();
    if (!/^[A-Z]$/.test(upperLetter)) {
      return;
    }
    
    setYellowLetters(prev => {
      const existingIndex = prev.findIndex(item => item.letter === upperLetter);
      if (existingIndex >= 0) {
        // Add the new excluded position to existing entry
        const currentPositions = prev[existingIndex].excludedPositions;
        const newPositions = sourcePosition !== undefined && 
                             sourcePosition >= 0 && 
                             sourcePosition < wordLength &&
                             !currentPositions.includes(sourcePosition)
          ? [...currentPositions, sourcePosition]
          : currentPositions;

        const updatedItem = {
          ...prev[existingIndex],
          excludedPositions: newPositions
        };
        const newArray = [...prev];
        newArray[existingIndex] = updatedItem;
        triggerLetterAnimation(`yellow-${upperLetter}-${sourcePosition}`);
        return newArray;
      } else {
        // Create new entry
        triggerLetterAnimation(`yellow-${upperLetter}-${sourcePosition}`);
        return [...prev, {
          letter: upperLetter,
          excludedPositions: sourcePosition !== undefined && 
                             sourcePosition >= 0 && 
                             sourcePosition < wordLength 
            ? [sourcePosition] 
            : []
        }];
      }
    });
  }, [wordLength]);

  const addToGray = useCallback((letter: string) => {
    // Validate input
    if (!letter || typeof letter !== 'string' || letter.length !== 1) {
      return;
    }
    
    const upperLetter = letter.toUpperCase();
    if (!/^[A-Z]$/.test(upperLetter)) {
      return;
    }
    
    setGrayLetters(prev => {
      if (!prev.includes(upperLetter)) {
        triggerLetterAnimation(`gray-${upperLetter}`);
        return [...prev, upperLetter];
      }
      return prev;
    });
  }, []);

  const addToPosition = useCallback((letter: string, position: number) => {
    // Validate input
    if (!letter || typeof letter !== 'string' || letter.length !== 1) {
      return;
    }
    
    const upperLetter = letter.toUpperCase();
    if (!/^[A-Z]$/.test(upperLetter)) {
      return;
    }
    
    if (position < 0 || position >= wordLength) {
      return;
    }
    
    setKnownPositions(prev => {
      const newPositions = [...prev];
      newPositions[position] = upperLetter;
      triggerLetterAnimation(`position-${position}-${upperLetter}`);
      return newPositions;
    });
  }, [wordLength]);

  const removeFromYellow = useCallback((letter: string) => {
    setYellowLetters(prev => prev.filter(item => item.letter !== letter));
  }, []);

  const removeFromGray = useCallback((letter: string) => {
    setGrayLetters(prev => prev.filter(l => l !== letter));
  }, []);

  const removeFromPosition = useCallback((position: number) => {
    setKnownPositions(prev => {
      const newPositions = [...prev];
      newPositions[position] = '';
      return newPositions;
    });
  }, []);

  // Generate alphabet for dragging
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-x-hidden">
        {/* Cosmic background effects */}
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(120,119,198,0.3),transparent_50%)]"></div>
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_75%_75%,rgba(236,72,153,0.2),transparent_50%)]"></div>

        {/* Subtle background processing indicator - only when calculating entropy */}
        {isCalculatingEntropy && (
          <div className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white px-3 py-1 rounded-full text-sm shadow-lg opacity-80">
            🧠 Calculating...
          </div>
        )}

        {/* Remove the blocking loading screen - words load in background */}

        <div className="relative z-10 max-w-[2200px] mx-auto px-4 py-8">

          {/* Word Loading Status - Non-blocking indicator */}
          {wordsLoadingStatus && (
            <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 backdrop-blur-xl bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 border border-blue-400/30 rounded-2xl px-4 py-2 flex items-center space-x-2 shadow-xl animate-fadeIn">
              <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
              <span className="text-blue-200 text-sm font-medium">{wordsLoadingStatus}</span>
            </div>
          )}

          {/* Calculating Indicator at Top */}
          {isCalculating && (
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 backdrop-blur-xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-indigo-500/20 border border-purple-400/30 rounded-2xl px-6 py-3 flex items-center space-x-3 shadow-2xl animate-fadeIn">
              <div className="w-6 h-6 border-3 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
              <div className="flex flex-col">
                <span className="text-purple-200 text-lg font-semibold tracking-wide">
                  {isCalculatingEntropy ? 'Calculating optimal words...' : 'Filtering words...'}
                </span>
                <span className="text-purple-300/80 text-sm">
                  {isCalculatingEntropy ? 'Information theory analysis' : 'Applying constraints'}
                </span>
              </div>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}

          {/* Top Header Row - Wordle Helper left, Word Length Selector right */}
          <div className="flex justify-between items-center mb-8">
            {/* Wordle Helper Title - Left */}
            <div className="flex items-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 rounded-2xl flex items-center justify-center text-3xl hover:scale-110 transition-transform duration-300">
                🎯
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-300 ml-4 tracking-tight font-['Inter']">
                Wordle Helper
              </h1>
            </div>

            {/* Word Length Selector - Right */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-400/20 rounded-2xl shadow-2xl p-4 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 via-purple-600/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 rounded-xl flex items-center justify-center text-lg">
                    📏
                  </div>
                  <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 ml-2 tracking-wide font-['Inter']">
                    Word Length
                  </h2>
                </div>

                <div className="relative w-48">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-xl blur-xl"></div>
                  <div className="relative backdrop-blur-lg bg-white/10 border border-indigo-300/30 rounded-xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/10 via-purple-400/10 to-pink-400/10 animate-shimmer"></div>
                    <select
                      value={wordLength}
                      onChange={(e) => setWordLength(Number(e.target.value))}
                      className="w-full px-4 py-2 bg-transparent text-white font-semibold appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400/50 relative z-10"
                    >
                      {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(length => (
                        <option key={length} value={length} className="bg-slate-800 text-white">
                          {length} letters
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <div className="w-5 h-5 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-lg flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Side by side sections - Letters, Yellow, and Grey */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Drag Letters */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-400/20 rounded-3xl shadow-2xl p-5 relative overflow-hidden group hover:scale-[1.01] transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-indigo-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 rounded-xl flex items-center justify-center text-lg">
                    🔤
                  </div>
                  <h2 className="text-lg md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-300 to-purple-300 ml-3 tracking-wide font-['Inter']">
                    Letters
                  </h2>
                </div>
                <div className="min-h-20 flex flex-wrap gap-2 justify-center">
                  {alphabet.map((letter) => (
                    <LetterCard
                      key={letter}
                      letter={letter}
                      backgroundColor="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-sm border border-blue-400/30"
                      textColor="text-blue-100"
                      isInSource={true}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Yellow Letters - Wrong Position */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-amber-500/10 via-yellow-500/10 to-orange-500/10 border border-amber-400/20 rounded-3xl shadow-2xl p-5 relative overflow-hidden group hover:scale-[1.01] transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-600/5 via-yellow-600/5 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 rounded-xl flex items-center justify-center text-lg">
                    🟨
                  </div>
                  <h2 className="text-lg md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-300 to-orange-300 ml-3 tracking-wide font-['Inter']">
                    Yellow - Wrong Position
                  </h2>
                </div>
                <div className="text-center mb-4">
                  <p className="text-amber-200/80 text-sm">
                    Drop letters in the position slots where they are NOT located
                  </p>
                </div>

                {/* Position-specific drop zones for yellow letters */}
                <div className="flex justify-center gap-2 mb-4">
                  {Array.from({ length: wordLength }, (_, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div className="text-amber-300/60 text-xs mb-1">Pos {index + 1}</div>
                      <DropZone onDrop={(letter) => addToYellow(letter, index)}>
                        <div className="w-10 h-10 md:w-12 md:h-12 border-2 border-dashed border-amber-400/30 rounded-xl bg-amber-500/10 hover:border-amber-400/50 hover:bg-amber-500/20 transition-all duration-300 flex items-center justify-center">
                          <span className="text-amber-400/50 text-xs">❌</span>
                        </div>
                      </DropZone>
                    </div>
                  ))}
                </div>

                {/* Display current yellow letters with their excluded positions */}
                <div className="flex flex-wrap gap-3 justify-center">
                  {yellowLetters.map((letterInfo, index) => (
                    <div
                      key={`${letterInfo.letter}-${index}`}
                      className={`${animatingLetters.has(`yellow-${letterInfo.letter}`)
                          ? 'animate-dropIn'
                          : 'animate-fadeIn'
                        }`}
                      style={{ animationDelay: `${index * 100}ms` }}
                      title={`${letterInfo.letter} - Not in positions: ${letterInfo.excludedPositions.map(p => p + 1).join(', ')}`}
                    >
                      <div className="relative">
                        <LetterCard
                          letter={letterInfo.letter}
                          backgroundColor="bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg shadow-amber-500/25"
                          textColor="text-amber-900"
                          onRemove={() => removeFromYellow(letterInfo.letter)}
                        />
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-amber-900 text-amber-100 text-xs px-1 rounded">
                          ≠{letterInfo.excludedPositions.map(p => p + 1).join(',')}
                        </div>
                      </div>
                    </div>
                  ))}
                  {yellowLetters.length === 0 && (
                    <div className="text-amber-300/70 text-center w-full py-3 italic font-['Inter'] text-sm">
                      Drag letters to position slots above to mark wrong positions
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Gray Letters - Not in Word */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-slate-500/10 via-gray-500/10 to-zinc-500/10 border border-slate-400/20 rounded-3xl shadow-2xl p-5 relative overflow-hidden group hover:scale-[1.01] transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-600/5 via-gray-600/5 to-zinc-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-slate-400 via-gray-400 to-zinc-400 rounded-xl flex items-center justify-center text-lg">
                    ⬛
                  </div>
                  <h2 className="text-lg md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-300 via-gray-300 to-zinc-300 ml-3 tracking-wide font-['Inter']">
                    Grey
                  </h2>
                </div>
                <DropZone onDrop={addToGray}>
                  <div className="min-h-20 flex flex-wrap gap-3 justify-center border-2 border-dashed border-slate-400/20 rounded-2xl p-3 hover:border-slate-400/40 transition-colors duration-300">
                    {grayLetters.map((letter, index) => (
                      <div
                        key={`${letter}-${index}`}
                        className={`${animatingLetters.has(`gray-${letter}`)
                            ? 'animate-dropIn'
                            : 'animate-fadeIn'
                          }`}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <LetterCard
                          letter={letter}
                          backgroundColor="bg-gradient-to-br from-slate-600 to-slate-700 shadow-lg shadow-slate-700/25"
                          textColor="text-slate-200"
                          onRemove={() => removeFromGray(letter)}
                        />
                      </div>
                    ))}
                    {grayLetters.length === 0 && (
                      <div className="text-slate-400/70 text-center w-full py-3 italic font-['Inter'] text-sm">
                        Not in word
                      </div>
                    )}
                  </div>
                </DropZone>
              </div>
            </div>
          </div>

          {/* Green - Known Positions - Below the side by side sections */}
          <div className="backdrop-blur-xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-400/20 rounded-3xl shadow-2xl p-5 mb-6 relative overflow-hidden group hover:scale-[1.01] transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 via-teal-600/5 to-cyan-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-xl flex items-center justify-center text-lg">
                  🟩
                </div>
                <h2 className="text-lg md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 ml-3 tracking-wide font-['Inter']">
                  Green - Confirmed Positions
                </h2>
              </div>
              <div className="text-center mb-4">
                <p className="text-emerald-200/80 text-sm">
                  Drop letters here to confirm they are in the correct position. Right-click to move to yellow.
                </p>
              </div>
              <div className="flex justify-center gap-2 md:gap-3">
                {knownPositions.map((letter, index) => (
                  <DropZone key={index} onDrop={(droppedLetter) => addToPosition(droppedLetter, index)}>
                    <div
                      className={`w-12 h-12 md:w-14 md:h-14 border-2 border-emerald-400/30 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-lg md:text-xl font-bold text-emerald-200 hover:border-emerald-400/60 transition-all duration-300 backdrop-blur-sm relative ${animatingLetters.has(`position-${index}-${letter}`) ? 'animate-dropIn' : ''
                        }`}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (letter) {
                          addToYellow(letter, index);
                          removeFromPosition(index);
                        }
                      }}
                    >
                      {letter || (index + 1)}
                      {letter && (
                        <button
                          onClick={() => removeFromPosition(index)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs hover:bg-red-600 transition-colors duration-200"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </DropZone>
                ))}
              </div>
            </div>
          </div>

          {/* CRITICAL: Calculated Words Sorted by Information Bits - Always Show When Available */}
          {entropyResults.length > 0 && (
            <div className="backdrop-blur-xl bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-purple-500/10 border border-violet-400/20 rounded-3xl shadow-2xl p-8 mb-6 relative overflow-hidden group hover:scale-[1.01] transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 via-fuchsia-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-purple-400 rounded-2xl flex items-center justify-center text-3xl hover:scale-110 transition-transform duration-300">
                  🧠
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-purple-300 ml-4 tracking-wide font-['Inter']">
                  Optimal Next Words
                </h2>
              </div>
              <div className="text-center mb-6">
                <p className="text-violet-200 text-lg leading-relaxed max-w-3xl mx-auto">
                  Words ranked by information theory - higher bits = better choice
                </p>
              </div>
              {entropyResults.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {entropyResults.map((calculation: EntropyResult, index: number) => (
                    <div
                      key={index}
                      className="backdrop-blur-sm bg-white/10 border border-violet-300/20 rounded-2xl p-4 hover:shadow-xl hover:shadow-violet-500/25 hover:border-violet-300/40 transition-all duration-300 hover:scale-105 relative overflow-hidden group/card animate-fadeIn"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-violet-400/10 to-fuchsia-400/10 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative z-10">
                        <div className="font-mono font-black text-lg md:text-xl text-violet-200 mb-2 tracking-wider text-center">
                          {calculation.word}
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300 mb-1">
                            {calculation.bitsOfInfo}
                          </div>
                          <div className="text-xs text-violet-300/80 uppercase tracking-wide">
                            bits
                          </div>
                        </div>
                      </div>
                      <div className="absolute inset-0 -left-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 group-hover/card:left-full transition-all duration-1000 ease-out"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-violet-300">
                  <p>Calculating optimal words...</p>
                </div>
              )}
            </div>
          </div>
          )}

          {/* Starting Word Suggestions - Always show when no constraints */}
          {startingWordSuggestions.length > 0 && (
            <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-violet-500/10 border border-purple-400/20 rounded-3xl shadow-2xl p-8 mb-6 relative overflow-hidden group hover:scale-[1.01] transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-pink-600/5 to-violet-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-400 via-pink-400 to-violet-400 rounded-2xl flex items-center justify-center text-3xl hover:scale-110 transition-transform duration-300">
                    🎯
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-violet-300 ml-4 tracking-wide font-['Inter']">
                    Best Starting Words ({wordLength} Letters)
                  </h2>
                </div>
                <div className="text-center mb-6">
                  <p className="text-purple-200 text-lg leading-relaxed max-w-3xl mx-auto">
                    Pre-computed optimal starting words based on letter frequency and information theory
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {startingWordSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="backdrop-blur-sm bg-white/10 border border-purple-300/20 rounded-2xl p-4 hover:shadow-xl hover:shadow-purple-500/25 hover:border-purple-300/40 transition-all duration-300 hover:scale-105 relative overflow-hidden group/card animate-fadeIn"
                      style={{ animationDelay: `${index * 100}ms` }}
                      title={suggestion.description}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-pink-400/10 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative z-10">
                        <div className="font-mono font-black text-lg md:text-xl text-purple-200 mb-2 tracking-wider text-center">
                          {suggestion.word}
                        </div>
                        {suggestion.entropy && (
                          <div className="text-center">
                            <div className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">
                              {suggestion.entropy} bits
                            </div>
                          </div>
                        )}
                        {suggestion.description && (
                          <div className="text-xs text-purple-300/80 text-center mt-1">
                            {suggestion.description}
                          </div>
                        )}
                      </div>
                      <div className="absolute inset-0 -left-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 group-hover/card:left-full transition-all duration-1000 ease-out"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Victory Celebration */}
          {isGameWon && (
            <div className="backdrop-blur-xl bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-amber-500/10 border border-yellow-400/20 rounded-3xl shadow-2xl p-8 mb-6 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/5 via-orange-600/5 to-amber-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 via-orange-400 to-amber-400 rounded-3xl flex items-center justify-center text-4xl">
                    🎉
                  </div>
                  <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-300 to-amber-300 ml-6 tracking-wide">
                    Victory!
                  </h2>
                </div>
                <div className="text-center">
                  <div className="font-mono font-black text-5xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-orange-200 mb-4 tracking-wider animate-glow">
                    {filteredWords[0]}
                  </div>
                  <p className="text-yellow-200 text-xl leading-relaxed">
                    Found the answer!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Remaining Possibilities */}
          {filteredWords.length > 1 && (
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl p-8 relative overflow-hidden group hover:scale-[1.01] transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-slate-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-slate-400 to-slate-500 rounded-2xl flex items-center justify-center text-3xl">
                    📋
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-300 to-slate-100 ml-4 tracking-wide font-['Inter']">
                    {filteredWords.length} Possibilities
                  </h2>
                </div>
                {filteredWords.length <= 50 && (
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                    {filteredWords.map((word: string, index: number) => (
                      <div
                        key={index}
                        className="backdrop-blur-sm bg-white/10 border border-slate-400/20 rounded-xl px-3 py-2 font-mono font-bold text-slate-200 hover:bg-white/20 hover:border-slate-300/40 transition-all duration-300 hover:scale-105 animate-fadeIn text-center"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        {word}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Enhanced Calculation Status - Bottom indicator */}
          {isCalculating && (
            <div className="fixed bottom-6 right-6 backdrop-blur-xl bg-gradient-to-br from-purple-500/30 via-pink-500/30 to-indigo-500/30 border border-purple-400/40 rounded-2xl px-5 py-3 flex items-center space-x-3 shadow-2xl animate-fadeIn z-40">
              <div className="relative">
                <div className="w-5 h-5 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-5 h-5 border-2 border-pink-400/20 border-b-pink-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>
              <div className="flex flex-col">
                <span className="text-purple-200 text-sm font-bold tracking-wide">
                  {isCalculatingEntropy ? 'Entropy Analysis' : 'Word Filtering'}
                </span>
                <span className="text-purple-300/80 text-xs">
                  {isCalculatingEntropy ? `Analyzing ${words.length} words` : `Processing ${filteredWords.length} matches`}
                </span>
              </div>
            </div>
          )}

        </div>
      </div>
    </DndProvider>
  );
}

export default App;
