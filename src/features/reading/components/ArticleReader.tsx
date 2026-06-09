"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useReadingStore } from "../store/readingStore";

import { WordPopup } from "./WordPopup";

interface ArticleReaderProps {
  articleId: string;
  title: string;
  content: string;
  translatedContent?: string | null;
  difficultyScore: number;
  onComplete: () => void;
}

function splitIntoSentences(text: string): string[] {
  return text
    .replace(/([.!?])\s+/g, "$1|")
    .split("|")
    .filter((sentence) => sentence.trim().length > 0);
}

function cleanWordToken(word: string) {
  return word.replace(/[^\w'-]/g, "").toLowerCase();
}

export function ArticleReader({
  title,
  content,
  translatedContent,
  onComplete,
}: ArticleReaderProps) {
  const settings = useReadingStore(useShallow((state) => state.settings));
  const clickedWord = useReadingStore((state) => state.clickedWord);
  const setClickedWord = useReadingStore((state) => state.setClickedWord);
  const addUnknownWord = useReadingStore((state) => state.addUnknownWord);
  const removeUnknownWord = useReadingStore((state) => state.removeUnknownWord);
  const unknownWords = useReadingStore(useShallow((state) => state.unknownWords));
  const startReading = useReadingStore((state) => state.startReading);
  const resetSession = useReadingStore((state) => state.resetSession);

  const unknownWordsSet = useMemo(() => new Set(unknownWords), [unknownWords]);
  const sentences = useMemo(() => splitIntoSentences(content), [content]);

  const [showTranslation, setShowTranslation] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const [activeSentence, setActiveSentence] = useState(0);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [animatingWord, setAnimatingWord] = useState<string | null>(null);
  const [animKey, setAnimKey] = useState(0);

  const contentRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasCompletedRef = useRef(false);
  const isCompleted = readProgress > 95;

  useEffect(() => {
    startReading();
    return () => resetSession();
  }, [resetSession, startReading]);

  useEffect(() => {
    if (!animatingWord) return;
    const timer = setTimeout(() => setAnimatingWord(null), 600);
    return () => clearTimeout(timer);
  }, [animatingWord, animKey]);

  const handleScroll = useCallback(() => {
    if (!contentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    const progress = Math.min((scrollTop / Math.max(scrollHeight - clientHeight, 1)) * 100, 100);

    setReadProgress(Math.round(progress));
    setIsAtTop(scrollTop < 20);
    setIsAtBottom(scrollTop + clientHeight >= scrollHeight - 60);

    const sentenceElements = contentRef.current.querySelectorAll("[data-sentence]");
    let currentSentence = 0;
    const viewportCenter = scrollTop + clientHeight / 3;

    sentenceElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const containerRect = contentRef.current!.getBoundingClientRect();
      const elementTop = rect.top - containerRect.top + scrollTop;
      if (elementTop <= viewportCenter) {
        currentSentence = Number(element.getAttribute("data-sentence") || "0");
      }
    });
    setActiveSentence(currentSentence);

    if (progress > 95 && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      toast.success("阅读完成");
      onComplete();
    }
  }, [onComplete]);

  const openWord = useCallback(
    (word: string) => {
      const cleanWord = cleanWordToken(word);
      if (!cleanWord) return;
      setClickedWord(cleanWord);
      setAnimatingWord(cleanWord);
      setAnimKey((previous) => previous + 1);
    },
    [setClickedWord],
  );

  const handleWordClick = useCallback(
    (event: React.MouseEvent) => {
      const target = event.target as HTMLElement;
      const wordElement = target.closest("[data-word]") as HTMLElement | null;
      if (wordElement?.dataset.word) openWord(wordElement.dataset.word);
    },
    [openWord],
  );

  const handleWordTouchStart = useCallback(
    (event: React.TouchEvent) => {
      const target = event.target as HTMLElement;
      const wordElement = target.closest("[data-word]") as HTMLElement | null;
      if (!wordElement?.dataset.word) return;

      longPressTimer.current = setTimeout(() => openWord(wordElement.dataset.word || ""), 500);
    },
    [openWord],
  );

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleMarkMastered = useCallback(
    (word: string) => {
      removeUnknownWord(word);
      toast.success("已标记为掌握");
    },
    [removeUnknownWord],
  );

  const handleAddUnknown = useCallback(
    (word: string) => {
      addUnknownWord(word);
      toast.success("已加入本文生词");
    },
    [addUnknownWord],
  );

  const scrollToTop = useCallback(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const scrollToBottom = useCallback(() => {
    if (!contentRef.current) return;
    contentRef.current.scrollTo({
      top: contentRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  const renderWord = (word: string, index: number) => {
    const cleanWord = cleanWordToken(word);
    const isUnknown = unknownWordsSet.has(cleanWord);
    const isClicked = clickedWord === cleanWord;
    const isRippling = animatingWord === cleanWord;

    return (
      <motion.span
        key={index}
        data-word={cleanWord}
        onTouchStart={handleWordTouchStart}
        onTouchMove={clearLongPress}
        onTouchEnd={clearLongPress}
        whileTap={{ scale: 1.05 }}
        className={cn(
          "relative -mx-0.5 inline-block cursor-pointer select-none rounded-sm px-0.5 transition-all duration-150 hover:bg-primary/15 active:bg-primary/20",
          settings.highlightNewWords &&
            isUnknown &&
            "rounded bg-blue-500 px-1.5 py-0.5 text-[0.9em] font-medium text-white dark:bg-blue-600",
          isClicked && !isUnknown && "rounded bg-primary/20 ring-2 ring-primary/30",
        )}
      >
        {word}
        {isRippling && (
          <motion.span
            key={animKey}
            className="pointer-events-none absolute inset-0 rounded-full bg-primary/25"
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        )}
      </motion.span>
    );
  };

  return (
    <div className="relative min-h-[calc(100vh-12rem)]">
      <div className="sticky top-0 z-10 border-b border-border/50 bg-background/95 backdrop-blur-lg">
        <div className="px-4 py-2.5">
          <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
            <span>阅读进度</span>
            <motion.span
              className={cn(
                "font-mono tabular-nums transition-colors duration-300",
                isCompleted && "font-bold text-green-500",
              )}
              animate={isCompleted ? { scale: [1, 1.2, 1] } : { scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              {readProgress}%
            </motion.span>
          </div>
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-primary/20">
            <motion.div
              className={cn(
                "h-full rounded-full",
                isCompleted
                  ? "bg-gradient-to-r from-green-400 to-emerald-500"
                  : "bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500",
              )}
              initial={{ width: 0 }}
              animate={{ width: `${readProgress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between px-2 pb-2">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={scrollToTop}
              disabled={isAtTop}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={scrollToBottom}
              disabled={isAtBottom}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setShowTranslation(!showTranslation)}
            title={showTranslation ? "隐藏译文" : "显示译文"}
          >
            {showTranslation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div
        ref={contentRef}
        onScroll={handleScroll}
        onClick={handleWordClick}
        className="overflow-y-auto scroll-smooth px-5 py-6"
        style={
          {
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
            maxHeight: "calc(100vh - 18rem)",
            WebkitOverflowScrolling: "touch",
          } as React.CSSProperties
        }
      >
        <h1 className="mb-6 text-2xl font-bold tracking-tight">{title}</h1>

        <AnimatePresence initial={false}>
          {showTranslation && (
            <motion.section
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mb-6 rounded-lg border border-blue-200 bg-blue-50/80 p-4 text-blue-950 shadow-sm dark:border-blue-900/50 dark:bg-blue-950/25 dark:text-blue-50"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold">中文译文</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 rounded-md px-2 text-blue-800 hover:text-blue-950 dark:text-blue-200 dark:hover:text-blue-50"
                  onClick={() => setShowTranslation(false)}
                >
                  收起
                </Button>
              </div>
              <p
                className="leading-relaxed"
                style={{
                  fontSize: `${Math.max(settings.fontSize - 2, 14)}px`,
                  lineHeight: settings.lineHeight,
                }}
              >
                {translatedContent || "暂无译文"}
              </p>
            </motion.section>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          {sentences.map((sentence, sentenceIndex) => (
            <motion.p
              key={sentenceIndex}
              data-sentence={sentenceIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{
                opacity: activeSentence === sentenceIndex ? 1 : 0.55,
                y: 0,
              }}
              transition={{ duration: 0.25 }}
              className={cn(
                "-mx-2 rounded-lg px-2 py-0.5 leading-relaxed",
                activeSentence === sentenceIndex && "bg-primary/5",
              )}
            >
              {sentence.split(/(\s+)/).map((token, tokenIndex) => {
                if (token.trim() === "") return <span key={tokenIndex}>{token}</span>;
                return renderWord(token, tokenIndex);
              })}
            </motion.p>
          ))}
        </div>

        <div className="h-8" />
      </div>

      <WordPopup
        word={clickedWord || ""}
        isOpen={clickedWord !== null}
        onClose={() => setClickedWord(null)}
        onToggleFavorite={() => toast.success("已切换收藏状态")}
        onMarkMastered={handleMarkMastered}
        onAddToUnknown={handleAddUnknown}
        isFavorite={false}
      />
    </div>
  );
}
