import { buildWeaknessList } from "@/features/study/services/studyDashboard";
import { apiSuccess, getAuthUserIdOrError, handleApiError } from "@/lib/api-helpers";
import { parseJsonArray } from "@/lib/json-array";
import { prisma } from "@/lib/prisma";

function normalizeStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "word" in item) {
          return String((item as { word?: unknown }).word ?? "");
        }
        if (item && typeof item === "object" && "text" in item) {
          return String((item as { text?: unknown }).text ?? "");
        }
        return "";
      })
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return parseJsonArray(value);
  }

  return [];
}

export async function GET() {
  try {
    const userId = await getAuthUserIdOrError();

    const [wordProgress, readingProgress, dictationRecords, writingRecords] = await Promise.all([
      prisma.userWordProgress.findMany({
        where: {
          userId,
          OR: [{ wrongCount: { gt: 0 } }, { masteryLevel: { lt: 2 } }],
        },
        include: {
          word: {
            select: {
              id: true,
              word: true,
              meaning: true,
            },
          },
        },
        orderBy: [{ wrongCount: "desc" }, { updatedAt: "desc" }],
        take: 40,
      }),
      prisma.userReadingProgress.findMany({
        where: { userId },
        include: {
          article: {
            select: {
              title: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 20,
      }),
      prisma.dictationRecord.findMany({
        where: {
          userId,
          isCorrect: false,
        },
        orderBy: { createdAt: "desc" },
        take: 40,
      }),
      prisma.writingRecord.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 20,
      }),
    ]);

    const items = buildWeaknessList({
      wordProgress: wordProgress.map((record) => ({
        id: record.id,
        wordId: record.wordId,
        word: record.word.word,
        meaning: record.word.meaning,
        wrongCount: record.wrongCount,
        masteryLevel: record.masteryLevel,
      })),
      readingProgress: readingProgress.map((record) => ({
        id: record.id,
        articleTitle: record.article.title,
        unknownWords: parseJsonArray(record.unknownWords),
        clickedWords: parseJsonArray(record.clickedWords),
      })),
      dictationRecords: dictationRecords.map((record) => ({
        id: record.id,
        word: record.word,
        correctAnswer: record.correctAnswer,
        userAnswer: record.userAnswer,
        isCorrect: record.isCorrect,
      })),
      writingRecords: writingRecords.map((record) => ({
        id: record.id,
        title: record.title,
        outOfLevelWords: parseJsonArray(record.outOfLevelWords),
        spellingErrors: normalizeStringList(record.spellingErrors),
      })),
    });

    return apiSuccess({
      items,
      total: items.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
