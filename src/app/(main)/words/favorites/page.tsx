"use client";

import { Star, Volume2, StarOff } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageLoading } from "@/components/shared/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAudioStore } from "@/stores";

interface WordItem {
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

export default function FavoritesPage() {
  const [words, setWords] = useState<WordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { play } = useAudioStore();

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/words/favorites?limit=100");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setWords(data.words || []);
    } catch {
      toast.error("加载收藏列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleUnfavorite = async (wordId: string) => {
    try {
      await fetch(`/api/words/${wordId}/favorite`, { method: "POST" });
      setWords((prev) => prev.filter((w) => w.id !== wordId));
      toast.success("已取消收藏");
    } catch {
      toast.error("操作失败");
    }
  };

  if (loading) return <PageLoading />;

  return (
    <div>
      <Header title="我的收藏" showBack />
      <div className="max-w-lg mx-auto p-4 space-y-3">
        {words.length === 0 ? (
          <EmptyState
            icon={<Star className="h-12 w-12" />}
            title="暂无收藏"
            description="在学习或浏览单词时，点击星标即可收藏"
          />
        ) : (
          words.map((word) => (
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
                    {word.tags?.length > 0 && (
                      <div className="flex gap-1 mt-1.5">
                        {word.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </Link>
                  <div className="flex items-center gap-1 ml-3">
                    <button
                      onClick={() => play(word.word)}
                      className="p-2 rounded-full hover:bg-accent transition-colors"
                    >
                      <Volume2 className="h-4 w-4 text-primary" />
                    </button>
                    <button
                      onClick={() => handleUnfavorite(word.id)}
                      className="p-2 rounded-full hover:bg-accent transition-colors"
                    >
                      <StarOff className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
