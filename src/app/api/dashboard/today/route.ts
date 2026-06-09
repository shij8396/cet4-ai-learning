import { buildTodayDashboard } from "@/features/study/services/studyDashboard";
import { apiSuccess, getAuthUserIdOrError, handleApiError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

export async function GET() {
  try {
    const userId = await getAuthUserIdOrError();
    const { start, end } = getTodayRange();

    const [dailyStat, weakWordCount, recentDictationWrongCount] = await Promise.all([
      prisma.dailyStat.findFirst({
        where: {
          userId,
          date: {
            gte: start,
            lt: end,
          },
        },
      }),
      prisma.userWordProgress.count({
        where: {
          userId,
          OR: [{ wrongCount: { gt: 0 } }, { masteryLevel: { lt: 2 } }],
        },
      }),
      prisma.dictationRecord.count({
        where: {
          userId,
          isCorrect: false,
        },
      }),
    ]);

    return apiSuccess(
      buildTodayDashboard({
        wordsLearned: dailyStat?.wordsLearned ?? 0,
        wordsReviewed: dailyStat?.wordsReviewed ?? 0,
        articlesRead: dailyStat?.articlesRead ?? 0,
        dictations: dailyStat?.dictations ?? 0,
        writingCount: dailyStat?.writingCount ?? 0,
        studyMinutes: dailyStat?.studyMinutes ?? 0,
        weakPointCount: weakWordCount + recentDictationWrongCount,
      }),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
