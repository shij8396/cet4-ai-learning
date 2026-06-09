"use client";

import { motion } from "framer-motion";
import { BookOpen, GraduationCap, Search, Star, Volume2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useState } from "react";

import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageLoading } from "@/components/shared/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { pronunciationService } from "@/services/audio/pronunciationService";
import { useWordCacheStore, type WordWithProgress } from "@/stores/wordCacheStore";

const PAGE_SIZE = 80;

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.16 } },
};

function formatPhonetic(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}/`;
}

const MasteryDots = memo(function MasteryDots({ level }: { level: number }) {
  const color = level >= 5 ? "bg-emerald-500" : level >= 3 ? "bg-amber-500" : "bg-orange-500";

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className={`h-1.5 w-3 rounded-full ${index < level ? color : "bg-muted"}`}
        />
      ))}
    </div>
  );
});

const WordItem = memo(function WordItem({
  word,
  onPlay,
}: {
  word: WordWithProgress;
  onPlay: (word: string) => void;
}) {
  const phonetic = formatPhonetic(word.phonetic);

  return (
    <Link href={`/words/${word.id}`}>
      <Card className="cursor-pointer transition-shadow active:scale-[0.99]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex min-w-0 items-center gap-2">
                <h3 className="truncate text-lg font-semibold">{word.word}</h3>
                {phonetic && (
                  <span className="shrink-0 text-xs font-mono text-muted-foreground">
                    {phonetic}
                  </span>
                )}
                {word.progress?.isFavorite && (
                  <Star className="h-3.5 w-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
                )}
              </div>
              <p className="truncate text-sm text-muted-foreground">{word.meaning}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {word.progress && word.progress.masteryLevel > 0 && (
                  <MasteryDots level={word.progress.masteryLevel} />
                )}
                {word.partOfSpeech && (
                  <Badge variant="outline" className="text-[10px]">
                    {word.partOfSpeech}
                  </Badge>
                )}
                {word.tags?.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <button
              onClick={(event) => {
                event.preventDefault();
                onPlay(word.word);
              }}
              className="rounded-full p-2 transition-colors hover:bg-accent"
              aria-label="播放发音"
            >
              <Volume2 className="h-5 w-5 text-primary" />
            </button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
});

export default function WordsPage() {
  const { words, loading, fetchWords } = useWordCacheStore();
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const router = useRouter();

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search]);

  const filteredWords = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return words;

    return words.filter(
      (word) =>
        word.word.toLowerCase().includes(keyword) ||
        word.meaning.toLowerCase().includes(keyword) ||
        word.tags?.some((tag) => tag.toLowerCase().includes(keyword)),
    );
  }, [search, words]);

  const visibleWords = filteredWords.slice(0, visibleCount);

  const handlePlay = useCallback((word: string) => {
    pronunciationService.play(word);
  }, []);

  if (loading && words.length === 0) return <PageLoading />;

  return (
    <div>
      <Header title="四级词库" />
      <motion.div
        className="mx-auto max-w-lg space-y-4 p-4"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.03 } } }}
      >
        <motion.div variants={itemVariants}>
          <Card className="border-0 bg-muted/60">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-muted-foreground">完整 CET-4 词库</p>
                <p className="text-2xl font-bold">{words.length || "..."}</p>
              </div>
              <Button onClick={() => router.push("/learn")}>
                <GraduationCap className="mr-1.5 h-4 w-4" />
                开始学习
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索 failure / overcome / prevent"
              className="pl-10"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => fetchWords(true)} title="刷新词库">
            <BookOpen className="h-4 w-4" />
          </Button>
        </motion.div>

        <motion.div variants={itemVariants} className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/words/favorites")}>
            <Star className="mr-1 h-3.5 w-3.5" />
            收藏
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push("/words/wrong")}>
            <BookOpen className="mr-1 h-3.5 w-3.5" />
            错词本
          </Button>
          <Badge variant="secondary" className="ml-auto px-2.5 py-1">
            匹配 {filteredWords.length}
          </Badge>
        </motion.div>

        {filteredWords.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-12 w-12" />}
            title={search ? "未找到匹配单词" : "暂无单词数据"}
            description={search ? "请尝试其他关键词" : "请先导入四级词库"}
          />
        ) : (
          <motion.div
            className="space-y-2"
            variants={{ visible: { transition: { staggerChildren: 0.02 } } }}
          >
            {visibleWords.map((word) => (
              <motion.div key={word.id} variants={itemVariants}>
                <WordItem word={word} onPlay={handlePlay} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {visibleCount < filteredWords.length && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
          >
            加载更多
          </Button>
        )}
      </motion.div>
    </div>
  );
}
