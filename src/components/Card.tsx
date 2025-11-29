import { motion } from 'motion/react';

interface CardProps {
  rank: string;
  suit: string;
  faceUp?: boolean;
  onClick?: () => void;
  className?: string;
  animate?: boolean;
}

export function Card({ rank, suit, faceUp = true, onClick, className = '', animate = false }: CardProps) {
  const isRed = suit === '♥' || suit === '♦';
  
  const cardContent = (
    <div
      onClick={onClick}
      className={`
        relative w-20 h-28 rounded-lg shadow-lg cursor-pointer
        transform transition-all duration-200
        ${onClick ? 'hover:scale-110 hover:-translate-y-2' : ''}
        ${faceUp ? 'bg-white' : 'bg-gradient-to-br from-[var(--color-fircik-green)] to-[var(--color-fircik-green-light)]'}
        ${className}
      `}
      style={{
        border: faceUp ? '2px solid var(--color-fircik-gray-light)' : '2px solid var(--color-fircik-gold)'
      }}
    >
      {faceUp ? (
        <>
          <div className={`absolute top-1 left-1 ${isRed ? 'text-[var(--color-fircik-red)]' : 'text-[var(--color-fircik-black)]'}`}>
            <div className="text-sm">{rank}</div>
            <div className="text-lg leading-none">{suit}</div>
          </div>
          
          <div className={`absolute inset-0 flex items-center justify-center ${isRed ? 'text-[var(--color-fircik-red)]' : 'text-[var(--color-fircik-black)]'}`}>
            <div className="text-4xl">{suit}</div>
          </div>
          
          <div className={`absolute bottom-1 right-1 rotate-180 ${isRed ? 'text-[var(--color-fircik-red)]' : 'text-[var(--color-fircik-black)]'}`}>
            <div className="text-sm">{rank}</div>
            <div className="text-lg leading-none">{suit}</div>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-4xl text-[var(--color-fircik-gold)]">🂠</div>
        </div>
      )}
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3 }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
}
