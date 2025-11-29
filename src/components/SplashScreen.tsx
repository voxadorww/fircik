import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => onComplete(), 300);
          return 100;
        }
        return prev + 10;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gradient-to-br from-[var(--color-fircik-green-dark)] to-[var(--color-fircik-green)] flex flex-col items-center justify-center landscape-only"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-12"
      >
        <h1 className="text-6xl mb-4 text-center">🂡 Fircik</h1>
        <p className="text-xl text-center text-[var(--color-fircik-beige)]">
          Klasična balkanska kartaška igra
        </p>
      </motion.div>

      <div className="w-64 h-2 bg-[var(--color-fircik-green-light)] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[var(--color-fircik-gold)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <p className="mt-6 text-[var(--color-fircik-gold-light)]">
        Učitavanje... {progress}%
      </p>
    </motion.div>
  );
}
