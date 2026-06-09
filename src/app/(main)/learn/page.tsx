"use client";

import { BookOpen, Check, SkipForward, Trophy, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";

import { Header } from "@/components/layout/Header";
import { WordCard } from "@/components/learn/WordCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageLoading } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAudioStore, useStudyStore } from "@/stores";
import { selectCurrentWord, selectProgress, useLearnStore } from "@/stores/learnStore";
import { useWordCacheStore } from "@/stores/wordCacheStore";

export default function LearnPage() {
  const router = useRouter();
  const { words: allWords, loading, fetchWords } = useWordCacheStore();
  const { play } = useAudioStore();
  const { incrementReviewed } = useStudyStore();

  const queue = useLearnStore((state) => state.queue);
  const currentIndex = useLearnStore((state) => state.currentIndex);
  const isComplete = useLearnStore((state) => state.isComplete);
  const stats = useLearnStore((state) => state.stats);
  const setQueue = useLearnStore((state) => state.setQueue);
  const startSession = useLearnStore((state) => state.startSession);
  const markCorrect = useLearnStore((state) => state.markCorrect);
  const markWrong = useLearnStore((state) => state.markWrong);
  const markSkipped = useLearnStore((state) => state.markSkipped);
  const resetSession = useLearnStore((state) => state.resetSession);

  const currentWord = useLearnStore(selectCurrentWord);
  const progress = useLearnStore(selectProgress);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  useEffect(() => {
    if (!loading && allWords.length > 0 && queue.length === 0) {
      setQueue(
        allWords.slice(0, 30).map((word) => ({
          id: word.id,
          word: word.word,
          phonetic: word.phonetic ?? null,
          meaning: word.meaning,
          partOfSpeech: word.partOfSpeech ?? null,
          example: word.example ?? null,
          exampleCn: word.exampleCn ?? null,
          tags: word.tags ?? [],
        })),
      );
      startSession();
    }
  }, [allWords, loading, queue.length, setQueue, startSession]);

  const handleReview = useCallback(
    async (result: "correct" | "wrong" | "skip") => {
      const state = useLearnStore.getState();
      const word = state.queue[state.currentIndex];
      if (!word) return;

      try {
        await fetch(`/api/words/${word.id}/review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            result,
            reviewType: "recognition",
          }),
        });
        incrementReviewed();
      } catch {
        console.error("Review record failed");
      }

      if (result === "correct") markCorrect(word.id);
      else if (result === "wrong") markWrong(word.id);
      else markSkipped();
    },
    [incrementReviewed, markCorrect, markSkipped, markWrong],
  );

  const handleToggleFavorite = useCallback(async () => {
    const word = useLearnStore.getState().queue[useLearnStore.getState().currentIndex];
    if (!word) return;

    try {
      await fetch(`/api/words/${word.id}/favorite`, { method: "POST" });
      toast.success("已切换收藏状态");
    } catch {
      toast.error("操作失败");
    }
  }, []);

  const handlePlayAudio = useCallback(() => {
    const word = useLearnStore.getState().queue[useLearnStore.getState().currentIndex];
    if (word) play(word.word);
  }, [play]);

  if (loading && queue.length === 0) return <PageLoading />;

  if (queue.length === 0) {
    return (
      <div>
        <Header title="单词学习" />
        <div className="mx-auto max-w-lg p-4">
          <EmptyState
            icon={<BookOpen className="h-12 w-12" />}
            title="暂无学习单词"
            description="请先导入四级词库数据"
          />
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div>
        <Header title="学习完成" />
        <div className="mx-auto max-w-lg p-4">
          <div className="py-12 text-center">
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Trophy className="h-10 w-10 text-primary" />
            </div>
            <h2 className="mb-2 text-2xl font-bold">学习完成</h2>
            <p className="mb-8 text-muted-foreground">你已完成本轮单词学习。</p>

            <div className="mx-auto mb-8 grid max-w-xs grid-cols-3 gap-4">
              <div className="rounded-xl bg-green-50 p-4 dark:bg-green-950">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.correct}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">认识</div>
              </div>
              <div className="rounded-xl bg-red-50 p-4 dark:bg-red-950">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats.wrong}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">不认识</div>
              </div>
              <div className="rounded-xl bg-muted p-4">
                <div className="text-2xl font-bold text-muted-foreground">{stats.skipped}</div>
                <div className="mt-1 text-xs text-muted-foreground">跳过</div>
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => router.push("/words")}>
                单词列表
              </Button>
              <Button
                onClick={() => {
                  resetSession();
                  startSession();
                }}
              >
                再来一轮
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="单词学习" />
      <div className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-lg flex-col p-4">
        <div className="mb-4 space-y-1">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              {currentIndex + 1} / {queue.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        <div className="flex flex-1 items-center justify-center">
          {currentWord && (
            <WordCard
              word={currentWord}
              isFavorite={false}
              onToggleFavorite={handleToggleFavorite}
              onPlayAudio={handlePlayAudio}
            />
          )}
        </div>

        <div className="flex items-center justify-center gap-4 pb-2 pt-6">
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleReview("wrong")}
            className="h-14 flex-1 rounded-2xl border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
          >
            <X className="mr-2 h-5 w-5" />
            不认识
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => handleReview("skip")}
            className="h-14 w-14 shrink-0 rounded-2xl"
            title="跳过"
          >
            <SkipForward className="h-5 w-5 text-muted-foreground" />
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => handleReview("correct")}
            className="h-14 flex-1 rounded-2xl border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-950"
          >
            <Check className="mr-2 h-5 w-5" />
            认识
          </Button>
        </div>
      </div>
    </div>
  );
}
