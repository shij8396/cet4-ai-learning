"use client";

import { BookOpen, Volume2, GraduationCap, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageLoading } from "@/components/shared/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAudioStore } from "@/stores";

interface WrongWordItem {
  id: string;
  word: string;
  phonetic: string | null;
  meaning: string;
  tags: string[];
  progress: {
    masteryLevel: number;
    reviewCount: number;
    wrongCount: number;
  };
}

export default function WrongWordsPage() {
  const [words, setWords] = useState<WrongWordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { play } = useAudioStore();
  const router = useRouter();

  const fetchWrongWords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/words/wrong?limit=100");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setWords(data.words || []);
    } catch {
      toast.error("加载错词列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWrongWords();
  }, [fetchWrongWords]);

  if (loading) return <PageLoading />;

  return (
    <div>
      <Header title="错词本" showBack />
      <div className="max-w-lg mx-auto p-4 space-y-3">
        {words.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-12 w-12" />}
            title="暂无错词"
            description="学习过程中标记不认识的单词会出现在这里"
            action={
              <Button onClick={() => router.push("/learn")}>
                <GraduationCap className="h-4 w-4 mr-2" />
                开始学习
              </Button>
            }
          />
        ) : (
          <>
            <div className="text-sm text-muted-foreground mb-2">
              共 {words.length} 个需要复习的单词
            </div>
            {words.map((word) => (
              <Card key={word.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <Link href={`/words/${word.id}`} className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{word.word}</h3>
                        {word.phonetic && (
                          <span className="text-xs text-muted-foreground">{word.phonetic}</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{word.meaning}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <AlertTriangle className="h-3 w-3 text-red-400" />
                          错误 {word.progress.wrongCount} 次
                        </div>
                        {word.tags?.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </Link>
                    <button
                      onClick={() => play(word.word)}
                      className="ml-3 p-2 rounded-full hover:bg-accent transition-colors"
                    >
                      <Volume2 className="h-5 w-5 text-primary" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
