"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, BookOpen, Check, Gauge, Star, Volume2, X } from "lucide-react";
import { memo, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { pronunciationService } from "@/services/audio/pronunciationService";

interface WordPopupProps {
  word: string;
  isOpen: boolean;
  onClose: () => void;
  onToggleFavorite?: (word: string) => void;
  onMarkMastered?: (word: string) => void;
  onAddToUnknown?: (word: string) => void;
  isFavorite?: boolean;
}

interface WordInfo {
  word: string;
  phonetic: string | null;
  meaning: string;
  example: string | null;
  exampleCn: string | null;
  partOfSpeech: string | null;
  isInCET4: boolean;
  suggestions: string[];
  lemma: string;
}

const BARS = [0.4, 0.7, 1, 0.6, 0.85, 0.5];

const SoundWave = memo(function SoundWave({ active }: { active: boolean }) {
  return (
    <div className="flex h-4 items-center gap-[3px]">
      {BARS.map((height, index) => (
        <motion.div
          key={index}
          className="w-[3px] rounded-full bg-current"
          animate={active ? { height: [4, height * 16, 4] } : { height: 4 }}
          transition={
            active
              ? {
                  duration: 0.5,
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: index * 0.08,
                  ease: "easeInOut",
                }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
});

const ShimmerBlock = memo(function ShimmerBlock({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-md bg-muted", className)}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
});

const SkeletonCard = memo(function SkeletonCard() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <ShimmerBlock className="h-8 w-28" />
          <ShimmerBlock className="h-4 w-32" />
        </div>
        <ShimmerBlock className="h-8 w-8 rounded-full" />
      </div>
      <div className="flex gap-2">
        <ShimmerBlock className="h-10 w-28" />
        <ShimmerBlock className="h-10 w-20" />
      </div>
      <ShimmerBlock className="h-20 w-full" />
    </div>
  );
});

function highlightWord(text: string, target: string) {
  const regex = new RegExp(`(${target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, index) =>
    part.toLowerCase() === target.toLowerCase() ? (
      <span key={index} className="not-italic font-semibold text-primary">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

function formatPhonetic(phonetic: string | null) {
  if (!phonetic) return "暂无音标";
  const trimmed = phonetic.trim();
  if (trimmed.startsWith("/") && trimmed.endsWith("/")) return trimmed;
  return `/${trimmed.replace(/^\/|\/$/g, "")}/`;
}

async function fetchWordInfo(word: string, signal: AbortSignal): Promise<WordInfo> {
  const response = await fetch("/api/vocabulary/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: word, checkLemmas: true }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Lookup failed: ${response.status}`);
  }

  const data = await response.json();
  return {
    word,
    phonetic: data.phonetic || null,
    meaning: data.meaning || "",
    example: data.example || null,
    exampleCn: data.exampleCn || null,
    partOfSpeech: data.partOfSpeech || null,
    isInCET4: data.isInCET4 ?? data.valid ?? false,
    suggestions: data.suggestions?.[0]?.suggestions || [],
    lemma: data.lemma || word,
  };
}

export const WordPopup = memo(function WordPopup({
  word,
  isOpen,
  onClose,
  onToggleFavorite,
  onMarkMastered,
  onAddToUnknown,
  isFavorite = false,
}: WordPopupProps) {
  const [wordInfo, setWordInfo] = useState<WordInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSlowMode, setIsSlowMode] = useState(false);
  const [starAnimating, setStarAnimating] = useState(false);

  useEffect(() => {
    const unsubscribe = pronunciationService.subscribe((state) => {
      setIsSpeaking(state.isPlaying && state.currentWord === word);
      setIsSlowMode(state.isSlowMode);
    });
    return unsubscribe;
  }, [word]);

  useEffect(() => {
    if (!isOpen || !word) return;

    const controller = new AbortController();
    setWordInfo(null);
    setLoading(true);

    fetchWordInfo(word, controller.signal)
      .then((info) => {
        setWordInfo(info);
        pronunciationService.prefetch(info.lemma || word);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setWordInfo({
          word,
          phonetic: null,
          meaning: "",
          example: null,
          exampleCn: null,
          partOfSpeech: null,
          isInCET4: false,
          suggestions: [],
          lemma: word,
        });
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [isOpen, word]);

  const handlePlay = useCallback(() => {
    pronunciationService.play(wordInfo?.lemma || word);
  }, [word, wordInfo?.lemma]);

  const handleSlowPlay = useCallback(() => {
    pronunciationService.toggleSlowMode();
    if (!isSpeaking) pronunciationService.play(wordInfo?.lemma || word);
  }, [isSpeaking, word, wordInfo?.lemma]);

  const handleFavorite = useCallback(() => {
    if (!onToggleFavorite) return;
    onToggleFavorite(word);
    setStarAnimating(true);
    setTimeout(() => setStarAnimating(false), 500);
    toast.success(isFavorite ? "已取消收藏" : "已加入收藏");
  }, [isFavorite, onToggleFavorite, word]);

  const handleAddUnknown = useCallback(() => {
    if (!onAddToUnknown) return;
    onAddToUnknown(word);
    toast.success("已加入生词本");
  }, [onAddToUnknown, word]);

  const handleMarkMastered = useCallback(() => {
    if (!onMarkMastered) return;
    onMarkMastered(word);
    onClose();
  }, [onClose, onMarkMastered, word]);

  const meaning = wordInfo?.meaning.trim() || "";
  const displayedWord = wordInfo?.lemma && wordInfo.lemma !== word ? wordInfo.lemma : word;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="pointer-events-none fixed inset-x-0 top-16 z-50 px-3 sm:top-20 sm:flex sm:justify-end sm:px-6 lg:left-auto lg:right-[max(1.5rem,calc((100vw-72rem)/2))]">
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="pointer-events-auto mx-auto w-full max-w-md overflow-hidden rounded-lg border border-border bg-background/98 shadow-xl backdrop-blur sm:mx-0"
          >
            <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">词义速查</p>
                <p className="text-sm font-medium text-foreground">已选中 {word}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {loading ? (
              <SkeletonCard />
            ) : wordInfo ? (
              <div className="max-h-[68vh] overflow-y-auto p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="break-words text-3xl font-bold tracking-tight">
                        {displayedWord}
                      </h2>
                      {wordInfo.partOfSpeech && (
                        <Badge variant="secondary" className="rounded-md text-xs">
                          {wordInfo.partOfSpeech}
                        </Badge>
                      )}
                      {wordInfo.isInCET4 && (
                        <Badge className="rounded-md bg-blue-600 text-xs text-white hover:bg-blue-600">
                          CET-4
                        </Badge>
                      )}
                    </div>

                    {wordInfo.lemma !== word && (
                      <p className="mt-1 text-xs text-muted-foreground">原文形式：{word}</p>
                    )}

                    <p className="mt-2 font-mono text-sm text-muted-foreground">
                      US {formatPhonetic(wordInfo.phonetic)}
                    </p>
                  </div>

                  {onToggleFavorite && (
                    <motion.button
                      onClick={handleFavorite}
                      animate={
                        starAnimating
                          ? {
                              scale: [1, 1.35, 0.95, 1],
                              transition: { duration: 0.4, ease: "easeOut" },
                            }
                          : {}
                      }
                      className={cn(
                        "shrink-0 rounded-full p-2 transition-colors",
                        isFavorite
                          ? "bg-yellow-500/10 text-yellow-600"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                      aria-label={isFavorite ? "取消收藏" : "收藏"}
                    >
                      <Star className={cn("h-5 w-5", isFavorite && "fill-current")} />
                    </motion.button>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button size="sm" onClick={handlePlay} className="h-10 rounded-md">
                    <Volume2 className="mr-2 h-4 w-4" />
                    {isSpeaking ? "播放中" : "发音"}
                    <SoundWave active={isSpeaking} />
                  </Button>
                  <Button
                    size="sm"
                    variant={isSlowMode ? "default" : "outline"}
                    onClick={handleSlowPlay}
                    className="h-10 rounded-md"
                  >
                    <Gauge className="mr-2 h-4 w-4" />
                    慢速
                  </Button>
                </div>

                <div className="mt-4 rounded-lg border border-border bg-muted/35 p-4">
                  <p className="text-base font-medium leading-relaxed text-foreground">
                    {meaning || "当前词库暂未收录该词释义"}
                  </p>
                  {!wordInfo.isInCET4 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      该词不在当前四级词库中，可作为扩展词记录。
                    </p>
                  )}
                </div>

                {wordInfo.example && (
                  <div className="mt-3 rounded-lg border border-border/70 p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      Example
                    </div>
                    <p className="text-sm italic leading-relaxed text-foreground/90">
                      {highlightWord(wordInfo.example, displayedWord)}
                    </p>
                    {wordInfo.exampleCn && (
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        {wordInfo.exampleCn}
                      </p>
                    )}
                  </div>
                )}

                {wordInfo.suggestions.length > 0 && (
                  <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                    相近词：{wordInfo.suggestions.join(", ")}
                  </p>
                )}

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {onAddToUnknown && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddUnknown}
                      className="h-10 rounded-md"
                    >
                      <Bookmark className="mr-2 h-4 w-4" />
                      生词本
                    </Button>
                  )}
                  {onMarkMastered && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMarkMastered}
                      className="h-10 rounded-md text-emerald-600 hover:text-emerald-700"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      已掌握
                    </Button>
                  )}
                </div>
              </div>
            ) : null}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});
