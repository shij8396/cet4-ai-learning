"use client";

import { motion } from "framer-motion";
import { BookOpen, GraduationCap, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { memo, useMemo, useState } from "react";

import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArticleCard } from "@/features/reading/components/ArticleCard";
import { READING_ARTICLES } from "@/features/reading/data/articles";

const LEVEL_LABELS: Record<number, string> = {
  1: "入门",
  2: "初级",
  3: "中级",
  4: "高级",
  5: "精通",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.03 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.18 } },
};

const LevelButton = memo(function LevelButton({
  level,
  isSelected,
  onClick,
}: {
  level: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant={isSelected ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      className="rounded-full"
    >
      {LEVEL_LABELS[level]}
    </Button>
  );
});

export default function ReadingPage() {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const router = useRouter();

  const filteredArticles = useMemo(
    () =>
      selectedLevel ? READING_ARTICLES.filter((a) => a.level === selectedLevel) : READING_ARTICLES,
    [selectedLevel],
  );

  const currentLevel = 1;
  const nextLevelThreshold = 80;
  const currentProgress = Math.min(currentLevel * 15, nextLevelThreshold);

  return (
    <div>
      <Header title="阅读训练" />
      <motion.div
        className="mx-auto max-w-lg space-y-4 p-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Card className="border-0 bg-green-500/10">
            <CardContent className="py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">阅读等级</p>
                  <p className="text-2xl font-bold text-green-600">Level {currentLevel}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => router.push("/learn")}>
                  <GraduationCap className="mr-1.5 h-3.5 w-3.5" />
                  去学习
                </Button>
              </div>
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>升级进度</span>
                  <span>{currentProgress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-green-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${currentProgress}%` }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">难度筛选</h3>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <LevelButton
                key={level}
                level={level}
                isSelected={selectedLevel === level}
                onClick={() => setSelectedLevel(selectedLevel === level ? null : level)}
              />
            ))}
          </div>
        </motion.div>

        {filteredArticles.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-12 w-12" />}
            title="暂无此等级文章"
            description="请选择其他难度等级"
          />
        ) : (
          <motion.div className="space-y-3" variants={containerVariants}>
            {filteredArticles.map((article, index) => (
              <motion.div
                key={article.id}
                variants={itemVariants}
                transition={{ delay: index * 0.02 }}
              >
                <ArticleCard
                  id={article.id}
                  title={article.title}
                  level={article.level}
                  difficultyScore={article.difficultyScore}
                  wordCount={article.wordCount}
                  vocabularyCoverage={article.vocabularyCoverage}
                  tags={article.tags}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
