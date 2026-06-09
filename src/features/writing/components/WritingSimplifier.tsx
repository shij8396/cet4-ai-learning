"use client";

import { Wand2, ArrowRight, Loader2 } from "lucide-react";
import { useState, useCallback } from "react";

import { Button } from "@/components/ui/button";

import { getLocalSimplifiedText, getAISimplifiedText } from "../services/writingService";

import type { SimplifierResponse } from "../types";

interface WritingSimplifierProps {
  originalText: string;
  onApply: (text: string) => void;
  onClose: () => void;
}

export function WritingSimplifier({ originalText, onApply }: WritingSimplifierProps) {
  const [result, setResult] = useState<SimplifierResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const simplify = useCallback(async () => {
    if (!originalText.trim()) return;

    setLoading(true);
    try {
      let res: SimplifierResponse;
      try {
        res = await getAISimplifiedText({
          originalText: originalText.trim(),
        });
      } catch {
        res = getLocalSimplifiedText({
          originalText: originalText.trim(),
        });
      }
      setResult(res);
    } catch {
      const res = getLocalSimplifiedText({
        originalText: originalText.trim(),
      });
      setResult(res);
    } finally {
      setLoading(false);
    }
  }, [originalText]);

  return (
    <div className="bg-card border rounded-xl p-4 space-y-3 animate-in slide-in-from-bottom-2">
      <div className="flex items-center gap-2">
        <Wand2 className="h-4 w-4 text-indigo-500" />
        <h3 className="text-sm font-semibold">作文简化</h3>
      </div>

      <p className="text-xs text-muted-foreground">将复杂表达简化为CET4级别的简单表达</p>

      <Button
        size="sm"
        variant="outline"
        onClick={simplify}
        disabled={!originalText.trim() || loading}
        className="w-full"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Wand2 className="h-4 w-4 mr-2" />
        )}
        简化当前作文
      </Button>

      {result && (
        <div className="space-y-3">
          {result.changes.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">修改建议:</p>
              {result.changes.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs py-1 px-2 rounded-md bg-muted/50"
                >
                  <span className="text-red-500 line-through">{c.original}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    {c.simplified}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{result.simplifiedText}</p>
          </div>

          <Button size="sm" onClick={() => onApply(result.simplifiedText)} className="w-full">
            替换为简化版本
          </Button>
        </div>
      )}
    </div>
  );
}
