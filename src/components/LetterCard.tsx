import React from 'react';
import { useDrag } from 'react-dnd';

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

export default LetterCard;