"use client";

import { Star, Volume2 } from "lucide-react";
import { memo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface WordCardProps {
  word: {
    id: string;
    word: string;
    phonetic?: string | null;
    meaning: string;
    example?: string | null;
    exampleCn?: string | null;
    tags: string[];
    partOfSpeech?: string | null;
  };
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onPlayAudio: () => void;
}

function formatPhonetic(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}/`;
}

function WordCardInner({ word, isFavorite, onToggleFavorite, onPlayAudio }: WordCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const phonetic = formatPhonetic(word.phonetic);

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0].clientX;
    touchEndX.current = event.touches[0].clientX;
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    touchEndX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchEndX.current - touchStartX.current;
    if (Math.abs(diff) > 60) {
      setSwipeDirection(diff > 0 ? "right" : "left");
    }
  };

  return (
    <div
      className={cn(
        "perspective-1000 relative mx-auto w-full max-w-sm transition-transform duration-300",
        swipeDirection === "left" && "-translate-x-full opacity-0",
        swipeDirection === "right" && "translate-x-full opacity-0",
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div
        className={cn(
          "transform-style-3d relative w-full transition-transform duration-500",
          isFlipped ? "rotate-y-180" : "",
        )}
      >
        <div className="w-full rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 via-primary/10 to-accent/20 p-8 shadow-lg">
          <div className="mb-6 flex items-start justify-between">
            <span className="rounded-full bg-background/60 px-2 py-1 text-xs font-medium text-muted-foreground">
              点击翻转
            </span>
            <div className="flex gap-1">
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleFavorite();
                }}
                className="rounded-full p-2 transition-colors hover:bg-background/60"
              >
                <Star
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground",
                  )}
                />
              </button>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onPlayAudio();
                }}
                className="rounded-full p-2 transition-colors hover:bg-background/60"
              >
                <Volume2 className="h-5 w-5 text-primary" />
              </button>
            </div>
          </div>

          <div className="py-8 text-center">
            <h2 className="mb-3 text-4xl font-bold tracking-tight">{word.word}</h2>
            {phonetic && <p className="mb-6 text-sm text-muted-foreground">{phonetic}</p>}
            {word.partOfSpeech && (
              <Badge variant="secondary" className="mb-4">
                {word.partOfSpeech}
              </Badge>
            )}
          </div>

          <p className="text-center text-lg font-medium text-primary">{word.meaning}</p>

          {word.example && (
            <div className="mt-6 rounded-lg bg-background/40 p-3">
              <p className="text-sm italic text-muted-foreground">{word.example}</p>
              {word.exampleCn && (
                <p className="mt-1 text-xs text-muted-foreground">{word.exampleCn}</p>
              )}
            </div>
          )}

          {word.tags && word.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {word.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="px-2 py-0 text-[10px]">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const WordCard = memo(WordCardInner);
