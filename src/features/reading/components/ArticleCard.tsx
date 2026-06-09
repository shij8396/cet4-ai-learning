"use client";

import { BookOpen, Clock } from "lucide-react";
import Link from "next/link";
import { memo, useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import {
  calculateEstimatedTime,
  getDifficultyLabel,
  getLevelLabel,
} from "../services/readingService";

interface ArticleCardProps {
  id: string;
  title: string;
  level: number;
  difficultyScore: number;
  wordCount: number;
  vocabularyCoverage: number;
  tags: string[];
  progress?: number;
  isCompleted?: boolean;
}

export const ArticleCard = memo(function ArticleCard({
  id,
  title,
  level,
  difficultyScore,
  wordCount,
  vocabularyCoverage,
  tags,
  progress,
  isCompleted,
}: ArticleCardProps) {
  const estimatedTime = useMemo(() => calculateEstimatedTime(wordCount), [wordCount]);
  const levelLabel = useMemo(() => getLevelLabel(level), [level]);
  const difficultyLabel = useMemo(() => getDifficultyLabel(difficultyScore), [difficultyScore]);
  const coveragePercent = useMemo(() => Math.round(vocabularyCoverage * 100), [vocabularyCoverage]);

  return (
    <Link href={`/reading/${id}`}>
      <Card className="relative cursor-pointer overflow-hidden transition-shadow active:scale-[0.99]">
        {isCompleted && (
          <div className="absolute right-0 top-0 rounded-bl-lg bg-green-500 px-2 py-0.5 text-[10px] font-medium text-white">
            已完成
          </div>
        )}
        <CardContent className="p-4">
          <div className="min-w-0">
            <h4 className="mb-1.5 line-clamp-1 text-base font-semibold">{title}</h4>
            <div className="mb-2 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {wordCount} 词
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {estimatedTime} 分钟
              </span>
              <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                {levelLabel}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">{difficultyLabel}</span>
              <span className="text-[10px] text-muted-foreground">覆盖率 {coveragePercent}%</span>
            </div>
            {tags?.length > 0 && (
              <div className="mt-2 flex gap-1">
                {tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="px-1.5 py-0 text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          {progress !== undefined && progress > 0 && !isCompleted && (
            <div className="mt-3">
              <div className="h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">已读 {Math.round(progress)}%</p>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
});
