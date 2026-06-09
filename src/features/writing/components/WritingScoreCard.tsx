"use client";

import { Star, Trophy, Target, BookOpen, BarChart3 } from "lucide-react";

import type { WritingScore, CoverageReport } from "../types";

interface WritingScoreCardProps {
  score: WritingScore | null;
  coverage: CoverageReport | null;
}

const GRADE_COLORS: Record<string, string> = {
  S: "text-amber-500 bg-amber-50 dark:bg-amber-950/30",
  A: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30",
  B: "text-blue-500 bg-blue-50 dark:bg-blue-950/30",
  C: "text-yellow-500 bg-yellow-50 dark:bg-yellow-950/30",
  D: "text-orange-500 bg-orange-50 dark:bg-orange-950/30",
  F: "text-red-500 bg-red-50 dark:bg-red-950/30",
};

export function WritingScoreCard({ score, coverage }: WritingScoreCardProps) {
  if (!score || !coverage) {
    return (
      <div className="bg-card border rounded-xl p-6 text-center text-sm text-muted-foreground">
        输入内容后自动显示评分
      </div>
    );
  }

  const gradeColor = GRADE_COLORS[score.grade] ?? GRADE_COLORS.F;

  return (
    <div className="bg-card border rounded-xl p-4 space-y-4 animate-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          作文评分
        </h3>
        <div
          className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-lg font-bold ${gradeColor}`}
        >
          {score.grade}
        </div>
      </div>

      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold tabular-nums">{score.overallScore}</span>
        <span className="text-sm text-muted-foreground mb-0.5">/100</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <ScoreItem
          icon={<BookOpen className="h-3.5 w-3.5" />}
          label="词汇分"
          value={score.vocabularyScore}
        />
        <ScoreItem
          icon={<BarChart3 className="h-3.5 w-3.5" />}
          label="语法分"
          value={score.grammarScore}
        />
        <ScoreItem
          icon={<Target className="h-3.5 w-3.5" />}
          label="可读性"
          value={score.readabilityScore}
        />
        <ScoreItem
          icon={<Star className="h-3.5 w-3.5" />}
          label="拼写准确"
          value={Math.round(score.spellingAccuracy * 100)}
          suffix="%"
        />
      </div>

      {coverage && (
        <div className="pt-2 border-t space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>已掌握词</span>
            <span>{coverage.masteredWords}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>新词</span>
            <span>{coverage.newWords}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>超纲词</span>
            <span>{coverage.outOfLevelWords}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>高频词</span>
            <span>{coverage.highFrequencyWords}</span>
          </div>
          <div className="flex justify-between text-xs font-medium pt-1">
            <span>覆盖率得分</span>
            <span>{coverage.coverageScore}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreItem({
  icon,
  label,
  value,
  suffix = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
      <span className="text-muted-foreground">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold tabular-nums">
          {value}
          {suffix}
        </p>
      </div>
    </div>
  );
}
