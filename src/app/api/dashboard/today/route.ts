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

export async function GET(request: Request) {
  try {
    const userId = await getAuthUserIdOrError();
    const { start, end } = getTodayRange();
    const now = new Date();

    const [
      dailyStat,
      dueWordCount,
      weakWordCount,
      recentDictationWrongCount,
      unreadArticleCount,
      lastWriting,
    ] = await Promise.all([
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
          nextReviewTime: { lte: now },
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
      prisma.readingArticle.count({
        where: {
          userProgress: {
            none: {
              userId,
              isCompleted: true,
            },
          },
        },
      }),
      prisma.writingRecord.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    const unresolvedWeaknessCount = weakWordCount + recentDictationWrongCount;

    const dashboard = buildTodayDashboard({
      wordsLearned: dailyStat?.wordsLearned ?? 0,
      wordsReviewed: dailyStat?.wordsReviewed ?? 0,
      articlesRead: dailyStat?.articlesRead ?? 0,
      dictations: dailyStat?.dictations ?? 0,
      writingCount: dailyStat?.writingCount ?? 0,
      studyMinutes: dailyStat?.studyMinutes ?? 0,
      weakPointCount: unresolvedWeaknessCount,
      dueWordCount,
      unreadArticleCount,
      unresolvedWeaknessCount,
      lastWritingAt: lastWriting?.createdAt ?? null,
    });

    await Promise.all(
      dashboard.tasks.map((task) =>
        prisma.studyTask.upsert({
          where: {
            userId_type_refId_dueDate: {
              userId,
              type: task.type,
              refId: "daily",
              dueDate: new Date(task.dueAt),
            },
          },
          update: {
            title: task.title,
            description: task.description,
            href: task.href,
            target: task.target,
            current: task.current,
            priority: task.priority,
            status: task.status,
            source: task.source,
            completedAt: task.status === "done" ? new Date() : null,
          },
          create: {
            userId,
            type: task.type,
            refId: "daily",
            title: task.title,
            description: task.description,
            href: task.href,
            target: task.target,
            current: task.current,
            priority: task.priority,
            status: task.status,
            source: task.source,
            dueDate: new Date(task.dueAt),
            completedAt: task.status === "done" ? new Date() : null,
          },
        }),
      ),
    );

    return apiSuccess(dashboard);
  } catch (error) {
    return handleApiError(error, request);
  }
}
