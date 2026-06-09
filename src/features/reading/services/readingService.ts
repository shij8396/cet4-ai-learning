import type { ReadingArticleType, UserReadingProgressType } from "@/types";

export type ArticleListResponse = {
  articles: ReadingArticleType[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export type ArticleDetailResponse = ReadingArticleType & {
  progress?: UserReadingProgressType | null;
};

export async function fetchArticles(params?: {
  page?: number;
  limit?: number;
  level?: number;
  tag?: string;
}): Promise<ArticleListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.level) searchParams.set("level", String(params.level));
  if (params?.tag) searchParams.set("tag", params.tag);

  const res = await fetch(`/api/reading?${searchParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch articles");
  return res.json();
}

export async function fetchArticleDetail(id: string): Promise<ArticleDetailResponse> {
  const res = await fetch(`/api/reading/${id}`);
  if (!res.ok) throw new Error("Failed to fetch article");
  return res.json();
}

export async function saveReadingProgress(
  articleId: string,
  data: {
    progress?: number;
    readTime?: number;
    clickedWords?: string[];
    unknownWords?: string[];
    isCompleted?: boolean;
  },
): Promise<void> {
  const res = await fetch(`/api/reading/${articleId}/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to save progress");
}

export async function fetchRecommendedArticles(params?: {
  level?: number;
}): Promise<ReadingArticleType[]> {
  const searchParams = new URLSearchParams();
  if (params?.level) searchParams.set("level", String(params.level));
  searchParams.set("recommended", "true");

  const res = await fetch(`/api/reading?${searchParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch recommendations");
  const data = await res.json();
  return data.articles;
}

export function calculateEstimatedTime(wordCount: number, wpm: number = 100): number {
  return Math.max(1, Math.ceil(wordCount / wpm));
}

export function getLevelLabel(level: number): string {
  switch (level) {
    case 1:
      return "入门";
    case 2:
      return "初级";
    case 3:
      return "中级";
    case 4:
      return "高级";
    case 5:
      return "精通";
    default:
      return `Level ${level}`;
  }
}

export function getDifficultyLabel(score: number): string {
  if (score < 25) return "简单";
  if (score < 50) return "中等";
  if (score < 75) return "较难";
  return "困难";
}
