import React from 'react';

interface LoadingIndicatorProps {
  isVisible: boolean;
  message?: string;
  subMessage?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
  isVisible, 
  message = "Loading...", 
  subMessage 
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fadeIn">
      {/* GTA-style loading indicator container */}
      <div className="relative">
        {/* Main circular progress indicator */}
        <div className="relative w-16 h-16">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-400 border-r-purple-500 animate-spin"></div>
          
          {/* Inner pulsing circle */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 animate-pulse"></div>
          
          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-ping"></div>
          </div>
          
          {/* Rotating outer glow */}
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-indigo-500/20 blur-md animate-spin-slow"></div>
        </div>
        
        {/* Message area */}
        <div className="absolute left-full ml-4 top-1/2 transform -translate-y-1/2 min-w-max">
          <div className="backdrop-blur-xl bg-gradient-to-br from-purple-900/80 via-pink-900/80 to-indigo-900/80 border border-purple-400/30 rounded-2xl px-4 py-2 shadow-2xl">
            {/* Main message */}
            <div className="text-purple-200 font-bold text-sm tracking-wide">
              {message}
            </div>
            
            {/* Sub message */}
            {subMessage && (
              <div className="text-purple-300/80 text-xs mt-1">
                {subMessage}
              </div>
            )}
            
            {/* Progress dots */}
            <div className="flex space-x-1 mt-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
          
          {/* Speech bubble arrow */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1">
            <div className="w-3 h-3 bg-gradient-to-br from-purple-900/80 to-pink-900/80 border-l border-b border-purple-400/30 transform rotate-45"></div>
          </div>
        </div>
      </div>
      
      {/* Background overlay for emphasis */}
      <div className="fixed inset-0 bg-black/10 backdrop-blur-[1px] pointer-events-none -z-10"></div>
    </div>
  );
};

// Loading states enum for better organization
export enum LoadingState {
  HIDDEN = 'hidden',
  LOADING_WORDS = 'loading_words',
  CALCULATING_ENTROPY = 'calculating_entropy',
  FILTERING_WORDS = 'filtering_words',
  PROCESSING = 'processing'
}

// Messages for different loading states
export const LoadingMessages = {
  [LoadingState.HIDDEN]: { message: '', subMessage: '' },
  [LoadingState.LOADING_WORDS]: { 
    message: 'Loading Dictionary', 
    subMessage: 'Fetching word lists...' 
  },
  [LoadingState.CALCULATING_ENTROPY]: { 
    message: 'Calculating Entropy', 
    subMessage: 'Finding optimal words...' 
  },
  [LoadingState.FILTERING_WORDS]: { 
    message: 'Filtering Words', 
    subMessage: 'Applying constraints...' 
  },
  [LoadingState.PROCESSING]: { 
    message: 'Processing', 
    subMessage: 'Please wait...' 
  },
};

// Hook for managing loading states
export const useLoadingState = () => {
  const [loadingState, setLoadingState] = React.useState<LoadingState>(LoadingState.HIDDEN);
  
  const showLoading = (state: LoadingState) => {
    setLoadingState(state);
  };
  
  const hideLoading = () => {
    setLoadingState(LoadingState.HIDDEN);
  };
  
  const isLoading = loadingState !== LoadingState.HIDDEN;
  
  return {
    loadingState,
    isLoading,
    showLoading,
    hideLoading,
    message: LoadingMessages[loadingState].message,
    subMessage: LoadingMessages[loadingState].subMessage
  };
};