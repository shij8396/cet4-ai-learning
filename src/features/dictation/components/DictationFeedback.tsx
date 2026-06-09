"use client";

import { ArrowRight, Bookmark, CheckCircle2, RefreshCw, Volume2, XCircle } from "lucide-react";
import { memo, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAudioStore } from "@/stores";

import type { AnswerResult } from "../services/dictationEngine";

interface DictationFeedbackProps {
  result: AnswerResult;
  streak: number;
  isLastWord: boolean;
  onNext: () => void;
  onRetry: () => void;
  onFinish: () => void;
  onToggleFav?: () => void;
}

export const DictationFeedback = memo(function DictationFeedback({
  result,
  streak,
  isLastWord,
  onNext,
  onRetry,
  onFinish,
  onToggleFav,
}: DictationFeedbackProps) {
  const { play } = useAudioStore();
  const isCorrect = result.isCorrect;

  useEffect(() => {
    if (isCorrect && streak >= 3) {
      const timer = setTimeout(() => navigator.vibrate?.(50), 200);
      return () => clearTimeout(timer);
    }
    if (!isCorrect) {
      const timer = setTimeout(() => navigator.vibrate?.([50, 100, 50]), 200);
      return () => clearTimeout(timer);
    }
  }, [isCorrect, streak]);

  return (
    <div className={cn("space-y-4 animate-in slide-in-from-bottom-2 duration-300")}>
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl py-6",
          isCorrect ? "bg-green-50 dark:bg-green-950/30" : "bg-red-50 dark:bg-red-950/30",
        )}
      >
        <div className="space-y-3 text-center">
          {isCorrect ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-bold text-green-700 dark:text-green-400">
                  {result.word}
                </p>
                <p className="text-sm text-green-600 dark:text-green-500">{result.meaning}</p>
              </div>
              {streak >= 3 && <Badge variant="secondary">连续正确 {streak} 次</Badge>}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm text-red-500 line-through">{result.userAnswer}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="text-lg font-bold text-red-700 dark:text-red-400">
                    {result.correctAnswer}
                  </span>
                </div>
                <p className="text-sm text-red-600 dark:text-red-500">{result.meaning}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        {!isCorrect && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="border-red-200 text-red-600 dark:text-red-400"
          >
            <RefreshCw className="mr-1.5 h-4 w-4" />
            重试
          </Button>
        )}

        <button
          onClick={() => play(result.word)}
          className="rounded-full p-2 transition-colors hover:bg-accent"
        >
          <Volume2 className="h-5 w-5 text-muted-foreground" />
        </button>

        {onToggleFav && (
          <button
            onClick={onToggleFav}
            className="rounded-full p-2 transition-colors hover:bg-accent"
          >
            <Bookmark className="h-5 w-5 text-muted-foreground" />
          </button>
        )}
      </div>

      <div className="flex justify-center">
        {isLastWord ? (
          <Button onClick={onFinish} className="min-w-[120px]">
            查看结果
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={onNext} className="min-w-[100px]">
            下一题
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
});
