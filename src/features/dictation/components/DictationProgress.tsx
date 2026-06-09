"use client";

import { CheckCircle2, SkipForward, XCircle } from "lucide-react";
import { memo } from "react";

import { Progress } from "@/components/ui/progress";

import type { AnswerResult } from "../services/dictationEngine";

interface DictationProgressProps {
  currentIndex: number;
  totalWords: number;
  results: AnswerResult[];
  streak: number;
}

export const DictationProgress = memo(function DictationProgress({
  currentIndex,
  totalWords,
  results,
  streak,
}: DictationProgressProps) {
  const progress = totalWords > 0 ? Math.round((currentIndex / totalWords) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>
            {Math.min(currentIndex + 1, totalWords)} / {totalWords}
          </span>
          {streak >= 3 && <span className="font-medium text-primary">连续正确 {streak}</span>}
        </div>
        <div className="flex items-center gap-1">
          {results.slice(-5).map((result, index) => (
            <span key={index}>
              {result.isCorrect ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : result.userAnswer.length === 0 ? (
                <SkipForward className="h-4 w-4 text-yellow-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </span>
          ))}
        </div>
      </div>
      <Progress value={progress} className="h-1.5" />
    </div>
  );
});
