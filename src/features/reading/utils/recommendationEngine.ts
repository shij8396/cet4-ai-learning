import { READING_ARTICLES } from "../data/articles";

import type { ReadingArticleType, UserReadingProgressType } from "@/types";

export interface RecommendationResult {
  article: ReadingArticleType;
  score: number;
  reason: string;
}

function calculateMatchScore(
  article: ReadingArticleType,
  options: {
    targetLevel: number;
    preferredTags: string[];
    readArticleIds: Set<string>;
  },
): number {
  let score = 0;

  const levelDiff = Math.abs(article.level - options.targetLevel);
  score += (1 - levelDiff * 0.3) * 40;

  const tagMatches = article.tags.filter((t) =>
    options.preferredTags.some((pt) => t.includes(pt)),
  ).length;
  score += tagMatches * 10;

  if (!options.readArticleIds.has(article.id)) {
    score += 20;
  }

  score += article.vocabularyCoverage * 10;

  return score;
}

export function recommendArticles(
  userLevel: number,
  readArticles: UserReadingProgressType[] = [],
  preferredTags: string[] = [],
  count: number = 5,
): RecommendationResult[] {
  const readIds = new Set(readArticles.map((p) => p.articleId));

  const results: RecommendationResult[] = READING_ARTICLES.map((article) => {
    const score = calculateMatchScore(article, {
      targetLevel: userLevel,
      preferredTags,
      readArticleIds: readIds,
    });

    let reason = "";
    if (article.level === userLevel) reason = "适合你的等级";
    else if (article.level < userLevel) reason = "适合复习";
    else reason = "适合挑战";

    return { article, score, reason };
  });

  return results.sort((a, b) => b.score - a.score).slice(0, count);
}

export function getNextRecommendedArticle(
  currentArticleId: string,
  userLevel: number,
  readArticles: UserReadingProgressType[],
): ReadingArticleType | null {
  const recommendations = recommendArticles(userLevel, readArticles);

  const next = recommendations.find((r) => r.article.id !== currentArticleId);

  return next?.article || null;
}

export function getArticlesByTag(tag: string): ReadingArticleType[] {
  return READING_ARTICLES.filter((a) => a.tags.some((t) => t.includes(tag)));
}

export function getRelatedArticles(articleId: string, count: number = 3): ReadingArticleType[] {
  const article = READING_ARTICLES.find((a) => a.id === articleId);
  if (!article) return [];

  const related = READING_ARTICLES.filter(
    (a) =>
      a.id !== articleId &&
      (a.level === article.level || a.tags.some((t) => article.tags.includes(t))),
  );

  return related.slice(0, count);
}
