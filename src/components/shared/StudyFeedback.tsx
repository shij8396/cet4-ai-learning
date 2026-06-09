"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface StreakCounterProps {
  count: number;
  label?: string;
}

export function StreakCounter({ count, label = "连击" }: StreakCounterProps) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          key="streak"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
            "bg-gradient-to-r from-orange-500 to-amber-500",
            "text-white text-xs font-bold shadow-sm",
            "animate-streak-glow",
          )}
        >
          <span className="text-sm">🔥</span>
          <motion.span
            key={count}
            initial={{ scale: 1.4 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
          >
            {count}
          </motion.span>
          <span className="font-medium opacity-90">{label}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ProgressCelebrationProps {
  show: boolean;
  message?: string;
  onComplete?: () => void;
}

export function ProgressCelebration({
  show,
  message = "太棒了！",
  onComplete,
}: ProgressCelebrationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center",
            "bg-black/30 backdrop-blur-sm",
          )}
        >
          <motion.div
            className={cn(
              "animate-celebrate",
              "px-8 py-6 rounded-2xl",
              "bg-gradient-to-br from-primary to-primary/80",
              "text-white text-center shadow-2xl",
            )}
          >
            <p className="text-3xl font-bold mb-1">{message}</p>
            <p className="text-sm opacity-80">继续加油</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface WordCountBadgeProps {
  learned: number;
  total: number;
}

export function WordCountBadge({ learned, total }: WordCountBadgeProps) {
  const percentage = total > 0 ? Math.round((learned / total) * 100) : 0;
  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="44" height="44" className="-rotate-90">
        <circle
          cx="22"
          cy="22"
          r="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-muted"
        />
        <motion.circle
          cx="22"
          cy="22"
          r="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className="text-primary"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-primary">
        {learned}/{total}
      </span>
    </div>
  );
}

interface FloatingRewardProps {
  text: string;
  show: boolean;
}

export function FloatingReward({ text, show }: FloatingRewardProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          initial={{ opacity: 1, y: 0, scale: 1 }}
          animate={{ opacity: 0, y: -40, scale: 0.8 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("inline-block font-bold text-sm", "text-amber-500 pointer-events-none")}
        >
          {text}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
