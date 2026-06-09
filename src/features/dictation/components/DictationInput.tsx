"use client";

import { Eye, EyeOff, Volume2 } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAudioStore } from "@/stores";

import { useDictationStore } from "../store/dictationStore";
import { checkRealtimeInput, getMatchingCharacters } from "../utils/spellChecker";

import type { DictationPrompt } from "../services/dictationEngine";

interface DictationInputProps {
  prompt: DictationPrompt;
  onSubmit: () => void;
  onPlayAudio?: () => void;
}

export const DictationInput = memo(function DictationInput({
  prompt,
  onSubmit,
  onPlayAudio,
}: DictationInputProps) {
  const { currentInput, setCurrentInput, currentCheck, setCurrentCheck, showResult } =
    useDictationStore();
  const { play } = useAudioStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (!showResult) {
      inputRef.current?.focus();
    }
  }, [showResult, prompt.wordId]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setCurrentInput(value);

      if (value.length > 0 && prompt.type !== "listen_to_en") {
        setCurrentCheck(checkRealtimeInput(value, prompt.correctAnswer));
      } else {
        setCurrentCheck(null);
      }
    },
    [prompt.correctAnswer, prompt.type, setCurrentCheck, setCurrentInput],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" && !showResult) {
        event.preventDefault();
        onSubmit();
      }
    },
    [onSubmit, showResult],
  );

  const matchedChars = currentCheck ? getMatchingCharacters(currentInput, prompt.correctAnswer) : 0;

  const inputClassName = cn(
    "h-12 w-full rounded-none border-0 border-b-2 bg-transparent px-2 text-center text-lg font-medium",
    "placeholder:text-muted-foreground/40 focus:outline-none focus:ring-0",
    showResult && "pointer-events-none",
    !showResult && !currentCheck && "border-muted-foreground/30 focus:border-primary",
    currentCheck?.isCorrect &&
      !currentCheck.isComplete &&
      "border-green-400 focus:border-green-500",
    !currentCheck?.isCorrect && currentInput.length > 0 && "border-red-400 focus:border-red-500",
  );

  return (
    <div className="space-y-4">
      {prompt.type === "listen_to_en" && (
        <button
          onClick={() => (onPlayAudio ? onPlayAudio() : play(prompt.word))}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 transition-colors hover:bg-primary/20"
        >
          <Volume2 className="h-8 w-8 text-primary" />
        </button>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={currentInput}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={
            prompt.type === "listen_to_en"
              ? "输入你听到的单词..."
              : prompt.type === "fill_in_blank"
                ? "填入单词..."
                : "输入英文单词..."
          }
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className={inputClassName}
          disabled={showResult}
        />

        {!showResult && matchedChars > 0 && currentInput.length > 0 && (
          <div className="absolute -bottom-5 left-0 right-0 flex justify-center">
            <span className="text-xs text-muted-foreground">
              已匹配 {matchedChars}/{prompt.correctAnswer.length} 个字母
            </span>
          </div>
        )}

        {currentCheck && !currentCheck.isCorrect && currentInput.length >= 3 && (
          <div className="absolute left-0 right-0 top-full mt-1">
            <div className="flex flex-wrap justify-center gap-1">
              {currentCheck.suggestions.slice(0, 3).map((suggestion) => (
                <button
                  key={suggestion}
                  className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent"
                  onClick={() => setCurrentInput(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-1">
        <button
          onClick={() => setShowHint(!showHint)}
          className="flex items-center gap-1 text-sm text-muted-foreground"
        >
          {showHint ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          提示
        </button>

        <Button
          onClick={onSubmit}
          disabled={showResult || currentInput.trim().length === 0}
          size="sm"
          className="min-w-[80px]"
        >
          确认
        </Button>
      </div>

      {showHint && (
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-sm font-medium">{prompt.hint}</p>
          {prompt.example && (
            <p className="mt-1 text-xs italic text-muted-foreground">{prompt.example}</p>
          )}
        </div>
      )}
    </div>
  );
});
