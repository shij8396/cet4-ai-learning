"use client";

import { Clock, Home, RotateCcw, Target, TrendingUp, Trophy, XCircle } from "lucide-react";
import { memo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { AnswerResult, DictationPrompt } from "../services/dictationEngine";
import type { SessionScore } from "../utils/scoringEngine";

interface DictationCompletedProps {
  score: SessionScore;
  results: AnswerResult[];
  wrongWords: DictationPrompt[];
  onRetryWrong: () => void;
  onNewSession: () => void;
  onGoHome: () => void;
}

const GRADE_COLORS: Record<string, string> = {
  S: "from-yellow-400 to-orange-500 text-white",
  A: "from-green-400 to-emerald-500 text-white",
  B: "from-blue-400 to-cyan-500 text-white",
  C: "from-slate-400 to-slate-500 text-white",
  D: "from-amber-400 to-orange-500 text-white",
  F: "from-red-400 to-red-500 text-white",
};

function gradeMessage(grade: string) {
  if (grade === "S") return "全对，拼写非常稳定。";
  if (grade === "A") return "表现很好，继续保持。";
  if (grade === "B") return "整体不错，错词需要及时复现。";
  if (grade === "C") return "建议把错词加入下一轮复习。";
  if (grade === "D") return "需要增加短频快默写练习。";
  return "先从错词复习开始，降低下一轮难度。";
}

export const DictationCompleted = memo(function DictationCompleted({
  score,
  results,
  wrongWords,
  onRetryWrong,
  onNewSession,
  onGoHome,
}: DictationCompletedProps) {
  return (
    <div className="mx-auto max-w-sm space-y-6 animate-in fade-in duration-500">
      <div className="space-y-3 text-center">
        <h2 className="text-2xl font-bold">默写完成</h2>

        <div
          className={cn(
            "inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br text-3xl font-bold shadow-lg",
            GRADE_COLORS[score.grade],
          )}
        >
          {score.grade}
        </div>

        <p className="text-sm text-muted-foreground">{gradeMessage(score.grade)}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="mx-auto mb-1 h-5 w-5 text-primary" />
            <p className="text-2xl font-bold">{Math.round(score.accuracy * 100)}%</p>
            <p className="text-xs text-muted-foreground">正确率</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="mx-auto mb-1 h-5 w-5 text-primary" />
            <p className="text-2xl font-bold">
              {score.totalTime < 60
                ? `${score.totalTime}s`
                : `${Math.floor(score.totalTime / 60)}m ${score.totalTime % 60}s`}
            </p>
            <p className="text-xs text-muted-foreground">总用时</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="mx-auto mb-1 h-5 w-5 text-primary" />
            <p className="text-2xl font-bold">{score.maxStreak}</p>
            <p className="text-xs text-muted-foreground">最大连对</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="mx-auto mb-1 h-5 w-5 text-primary" />
            <p className="text-2xl font-bold">{score.avgTimePerWord}s</p>
            <p className="text-xs text-muted-foreground">平均用时</p>
          </CardContent>
        </Card>
      </div>

      {wrongWords.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <h3 className="text-sm font-semibold">错误单词 ({wrongWords.length})</h3>
          </div>

          <div className="space-y-2">
            {wrongWords.map((word) => {
              const wrongResult = results.find(
                (result) => result.wordId === word.wordId && !result.isCorrect,
              );
              return (
                <div
                  key={word.wordId}
                  className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{word.correctAnswer}</p>
                    <p className="text-xs text-muted-foreground">{word.hint}</p>
                  </div>
                  {wrongResult?.userAnswer && (
                    <Badge variant="outline" className="text-xs text-red-500">
                      {wrongResult.userAnswer}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {wrongWords.length > 0 && (
          <Button onClick={onRetryWrong} className="w-full">
            <RotateCcw className="mr-2 h-4 w-4" />
            复习错误单词 ({wrongWords.length})
          </Button>
        )}
        <Button onClick={onNewSession} className="w-full" variant="outline">
          再次默写
        </Button>
        <Button onClick={onGoHome} className="w-full" variant="ghost">
          <Home className="mr-2 h-4 w-4" />
          返回首页
        </Button>
      </div>
    </div>
  );
});
