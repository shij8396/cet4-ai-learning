"use client";

import { useMemo, useRef, useCallback, useEffect } from "react";

import type { RealTimeAnalysis, WordAnalysis } from "../types";

interface HighlightedTextProps {
  text: string;
  analysis: RealTimeAnalysis | null;
  className?: string;
}

function getHighlightClass(word: WordAnalysis): string {
  if (word.isSpellingError) {
    return "border-b-2 border-red-400 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded px-0.5";
  }
  if (word.isOutOfLevel) {
    return "bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 rounded px-0.5";
  }
  if (word.isHighFrequency) {
    return "text-blue-600 dark:text-blue-400 font-medium";
  }
  if (word.isMastered) {
    return "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 rounded px-0.5";
  }
  return "";
}

export function HighlightedText({ text, analysis, className = "" }: HighlightedTextProps) {
  const segments = useMemo(() => {
    if (!text || !analysis?.words?.length) {
      return [{ text, className: "", key: "plain" }];
    }

    const sorted = [...analysis.words].sort((a, b) => a.startIndex - b.startIndex);

    const result: Array<{
      text: string;
      className: string;
      key: string;
    }> = [];

    let lastEnd = 0;

    for (const word of sorted) {
      if (word.startIndex > lastEnd) {
        result.push({
          text: text.slice(lastEnd, word.startIndex),
          className: "",
          key: `gap-${lastEnd}`,
        });
      }

      const original = text.slice(word.startIndex, word.endIndex);
      const hlClass = getHighlightClass(word);

      result.push({
        text: original,
        className: hlClass,
        key: `word-${word.startIndex}`,
      });

      lastEnd = word.endIndex;
    }

    if (lastEnd < text.length) {
      result.push({
        text: text.slice(lastEnd),
        className: "",
        key: `gap-${lastEnd}`,
      });
    }

    return result;
  }, [text, analysis]);

  return (
    <span className={className}>
      {segments.map((seg) => (
        <span key={seg.key} className={seg.className}>
          {seg.text}
        </span>
      ))}
    </span>
  );
}

interface WritingEditorProps {
  value: string;
  onChange: (value: string) => void;
  analysis: RealTimeAnalysis | null;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function WritingEditor({
  value,
  onChange,
  analysis,
  placeholder = "开始写作文...",
  disabled = false,
  autoFocus = false,
}: WritingEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(200, textarea.scrollHeight)}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const syncScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  return (
    <div className="relative w-full min-h-[200px]">
      <div
        ref={highlightRef}
        className="absolute inset-0 w-full min-h-[200px] p-4 text-base leading-relaxed whitespace-pre-wrap break-words overflow-hidden pointer-events-none font-[inherit] z-10"
        aria-hidden="true"
      >
        <HighlightedText text={value} analysis={analysis} />
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          adjustHeight();
        }}
        onScroll={syncScroll}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className="relative z-20 w-full min-h-[200px] p-4 text-base leading-relaxed resize-none bg-transparent text-transparent caret-foreground outline-none font-[inherit] placeholder:text-muted-foreground/40"
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
      />
    </div>
  );
}
