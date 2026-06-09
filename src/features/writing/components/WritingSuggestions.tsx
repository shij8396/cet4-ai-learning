"use client";

import { X, AlertTriangle, Sparkles, BookOpen, Zap } from "lucide-react";

import type { RealTimeAnalysis } from "../types";

interface WritingSuggestionsProps {
  analysis: RealTimeAnalysis | null;
  onClose: () => void;
}

export function WritingSuggestions({ analysis, onClose }: WritingSuggestionsProps) {
  if (!analysis) return null;

  const hasErrors =
    analysis.spellingErrors.length > 0 ||
    analysis.outOfLevelWords.length > 0 ||
    analysis.repeatedWords.length > 0;

  return (
    <div className="bg-card border rounded-xl p-4 space-y-3 animate-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500" />
          实时分析
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-muted rounded-md transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {!hasErrors && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 py-2">
          <BookOpen className="h-4 w-4" />
          目前没有发现问题，继续加油！
        </div>
      )}

      {analysis.spellingErrors.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
            <AlertTriangle className="h-3 w-3" />
            拼写错误 ({analysis.spellingErrors.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {analysis.spellingErrors.slice(0, 8).map((w, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300"
              >
                <span className="line-through">{w.word}</span>
                {w.spellingCorrections.length > 0 && (
                  <span className="text-muted-foreground">→ {w.spellingCorrections[0]}</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {analysis.outOfLevelWords.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-orange-600 dark:text-orange-400">
            <Zap className="h-3 w-3" />
            超纲词 ({analysis.outOfLevelWords.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {analysis.outOfLevelWords.slice(0, 8).map((w, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300"
              >
                <span>{w.word}</span>
                {w.levelReplacements.length > 0 && (
                  <span className="text-muted-foreground">→ {w.levelReplacements[0]}</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {analysis.repeatedWords.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-3 w-3" />
          重复词: {analysis.repeatedWords.map((r) => `${r.word}(×${r.count})`).join(", ")}
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t">
        <span>CET4覆盖: {(analysis.vocabularyCoverage * 100).toFixed(0)}%</span>
        <span>总词数: {analysis.words.length}</span>
      </div>
    </div>
  );
}
