import { apiSuccess, getAuthUserIdOrError, handleApiError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ type: string; id: string }> },
) {
  try {
    const userId = await getAuthUserIdOrError();
    const { type, id } = await params;

    if (type === "word") {
      await prisma.userWordProgress.updateMany({
        where: {
          userId,
          wordId: decodeURIComponent(id),
        },
        data: {
          wrongCount: 0,
          masteryLevel: 3,
          lastReviewTime: new Date(),
        },
      });
    }

    return apiSuccess({
      success: true,
      type,
      id,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
