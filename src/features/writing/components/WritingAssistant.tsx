"use client";

import { ArrowRight, Lightbulb, Loader2 } from "lucide-react";
import { useState, useCallback } from "react";

import { Button } from "@/components/ui/button";

import {
  getLocalAssistantSuggestions,
  getAIAssistantSuggestions,
} from "../services/writingService";

import type { AssistantResponse } from "../types";

interface WritingAssistantProps {
  onInsert: (text: string) => void;
  onClose: () => void;
}

export function WritingAssistant({ onInsert }: WritingAssistantProps) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [usedWords, setUsedWords] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const generate = useCallback(async () => {
    if (!input.trim()) return;

    setLoading(true);
    try {
      let result: AssistantResponse;
      try {
        result = await getAIAssistantSuggestions({
          chineseIdea: input.trim(),
        });
      } catch {
        result = getLocalAssistantSuggestions({
          chineseIdea: input.trim(),
        });
      }
      setSuggestions(result.suggestions);
      setUsedWords(result.usedWords);
    } catch {
      const result = getLocalAssistantSuggestions({
        chineseIdea: input.trim(),
      });
      setSuggestions(result.suggestions);
      setUsedWords(result.usedWords);
    } finally {
      setLoading(false);
    }
  }, [input]);

  return (
    <div className="bg-card border rounded-xl p-4 space-y-3 animate-in slide-in-from-bottom-2">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-semibold">CET4表达助手</h3>
      </div>

      <p className="text-xs text-muted-foreground">输入中文想法，系统将推荐CET4范围内的英文表达</p>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") generate();
          }}
          placeholder="例如：我认为大学生应该运动"
          className="flex-1 px-3 py-2 text-sm rounded-lg border bg-background outline-none focus:ring-2 focus:ring-ring"
        />
        <Button size="sm" onClick={generate} disabled={!input.trim() || loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">推荐表达:</p>
          {suggestions.map((s, i) => (
            <div
              key={i}
              className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <span className="text-sm flex-1 leading-relaxed">{s}</span>
              <button
                onClick={() => onInsert(s)}
                className="shrink-0 px-2 py-1 text-xs rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors opacity-0 group-hover:opacity-100"
              >
                插入
              </button>
            </div>
          ))}
        </div>
      )}

      {usedWords.length > 0 && (
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            可用CET4词: {usedWords.slice(0, 10).join(", ")}
            {usedWords.length > 10 ? "..." : ""}
          </p>
        </div>
      )}
    </div>
  );
}
