"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useMemo, memo } from "react";

import { Header } from "@/components/layout/Header";
import { SkeletonPage } from "@/components/shared/SkeletonLoading";
import { READING_ARTICLES } from "@/features/reading/data/articles";
import { useReadingStore } from "@/features/reading/store/readingStore";

const ArticleReader = dynamic(
  () =>
    import("@/features/reading/components/ArticleReader").then((m) => ({
      default: m.ArticleReader,
    })),
  {
    loading: () => <SkeletonPage />,
    ssr: false,
  },
);

const ReadingArticlePage = memo(function ReadingArticlePage() {
  const params = useParams();
  const resetSession = useReadingStore((s) => s.resetSession);

  const id = params.id as string;
  const article = useMemo(() => READING_ARTICLES.find((a) => a.id === id) || null, [id]);

  const handleComplete = () => {
    resetSession();
  };

  if (!article) {
    return (
      <div>
        <Header title="文章" showBack />
        <div className="max-w-lg mx-auto p-4 text-center py-16">
          <p className="text-muted-foreground">文章不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="沉浸阅读" showBack onBack={() => handleComplete()} />
      <div className="max-w-lg mx-auto">
        <ArticleReader
          articleId={article.id}
          title={article.title}
          content={article.content}
          translatedContent={article.translatedContent}
          difficultyScore={article.difficultyScore}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
});

export default ReadingArticlePage;
