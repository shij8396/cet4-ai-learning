import { api } from "@/lib/api-client";

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

  return api.get<ArticleListResponse>(`/api/v1/reading?${searchParams.toString()}`);
}

export async function fetchArticleDetail(id: string): Promise<ArticleDetailResponse> {
  return api.get<ArticleDetailResponse>(`/api/v1/reading/${id}`);
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
  await api.post(`/api/v1/reading/${articleId}/progress`, data);
}

export async function fetchRecommendedArticles(params?: {
  level?: number;
}): Promise<ReadingArticleType[]> {
  const searchParams = new URLSearchParams();
  if (params?.level) searchParams.set("level", String(params.level));
  searchParams.set("recommended", "true");

  const data = await api.get<ArticleListResponse>(`/api/v1/reading?${searchParams.toString()}`);
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
