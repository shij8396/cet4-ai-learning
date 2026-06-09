"use client";

import { Check, GraduationCap, Star, Volume2, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Header } from "@/components/layout/Header";
import { PageLoading } from "@/components/shared/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAudioStore, useStudyStore } from "@/stores";

interface WordDetail {
  id: string;
  word: string;
  phonetic: string | null;
  meaning: string;
  partOfSpeech: string | null;
  level: string;
  frequency: number;
  example: string | null;
  exampleCn: string | null;
  tags: string[];
  progress: {
    id: string;
    masteryLevel: number;
    reviewCount: number;
    wrongCount: number;
    isFavorite: boolean;
    lastReviewTime: string | null;
    nextReviewTime: string | null;
  } | null;
}

function formatPhonetic(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}/`;
}

function masteryText(level: number) {
  if (level === 0) return "未学习";
  if (level >= 5) return "已掌握";
  return `Lv.${level}`;
}

export default function WordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [word, setWord] = useState<WordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { play } = useAudioStore();
  const { incrementReviewed } = useStudyStore();

  const fetchWord = useCallback(async () => {
    try {
      const response = await fetch(`/api/words/${params.id}`);
      if (!response.ok) throw new Error("Word not found");
      setWord(await response.json());
    } catch {
      toast.error("无法加载单词信息");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchWord();
  }, [fetchWord]);

  const handleToggleFavorite = useCallback(async () => {
    if (!word) return;
    try {
      const response = await fetch(`/api/words/${word.id}/favorite`, { method: "POST" });
      const data = await response.json();
      setWord((previous) => (previous ? { ...previous, progress: data.progress } : previous));
      toast.success(data.isFavorite ? "已收藏" : "已取消收藏");
    } catch {
      toast.error("操作失败");
    }
  }, [word]);

  const handleReview = useCallback(
    async (result: "correct" | "wrong" | "skip") => {
      if (!word) return;
      try {
        const response = await fetch(`/api/words/${word.id}/review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ result, reviewType: "recognition" }),
        });
        const data = await response.json();
        setWord((previous) => (previous ? { ...previous, progress: data.progress } : previous));
        incrementReviewed();
        toast.success(
          result === "correct" ? "已掌握" : result === "wrong" ? "已记录错词" : "已跳过",
        );
      } catch {
        toast.error("操作失败");
      }
    },
    [incrementReviewed, word],
  );

  if (loading) return <PageLoading />;
  if (!word) return null;

  const masteryLevel = word.progress?.masteryLevel ?? 0;
  const masteryPercent = (masteryLevel / 5) * 100;
  const phonetic = formatPhonetic(word.phonetic);

  return (
    <div>
      <Header title="单词详情" showBack />
      <div className="mx-auto max-w-lg space-y-4 p-4">
        <Card className="border-2 border-primary/10">
          <CardContent className="py-6 text-center">
            <h1 className="mb-2 text-3xl font-bold">{word.word}</h1>
            {phonetic && <p className="mb-3 text-muted-foreground">{phonetic}</p>}
            <div className="mb-3 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => play(word.word)}>
                <Volume2 className="mr-2 h-4 w-4" />
                发音
              </Button>
              <Button variant="ghost" size="sm" onClick={handleToggleFavorite}>
                <Star
                  className={`h-4 w-4 ${
                    word.progress?.isFavorite ? "fill-yellow-400 text-yellow-400" : ""
                  }`}
                />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => router.push("/learn")}>
                <GraduationCap className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-lg font-medium text-primary">{word.meaning}</p>
            {word.partOfSpeech && (
              <Badge variant="secondary" className="mt-2">
                {word.partOfSpeech}
              </Badge>
            )}
          </CardContent>
        </Card>

        {word.example && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">例句</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="italic text-muted-foreground">{word.example}</p>
              {word.exampleCn && (
                <p className="mt-1 text-sm text-muted-foreground">{word.exampleCn}</p>
              )}
            </CardContent>
          </Card>
        )}

        {word.tags?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">标签</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {word.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">学习状态</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-muted-foreground">掌握程度</span>
                <span>{masteryText(masteryLevel)}</span>
              </div>
              <Progress value={masteryPercent} className="h-2" />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">复习次数</span>
              <span>{word.progress?.reviewCount ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">错误次数</span>
              <span>{word.progress?.wrongCount ?? 0}</span>
            </div>
            {word.progress?.lastReviewTime && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">上次复习</span>
                <span>{new Date(word.progress.lastReviewTime).toLocaleDateString("zh-CN")}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
            onClick={() => handleReview("wrong")}
          >
            <X className="mr-2 h-4 w-4" />
            不认识
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-green-200 text-green-600 hover:bg-green-50"
            onClick={() => handleReview("correct")}
          >
            <Check className="mr-2 h-4 w-4" />
            已掌握
          </Button>
        </div>
      </div>
    </div>
  );
}
