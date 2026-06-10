import { apiSuccess, getAuthUserIdOrError, handleApiError } from "@/lib/api-helpers";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ type: string; id: string }> },
) {
  try {
    const userId = await getAuthUserIdOrError();
    const { type, id } = await params;
    const decodedId = decodeURIComponent(id);
    const body = await request.json().catch(() => ({}));
    const reason = typeof body.reason === "string" ? body.reason.slice(0, 300) : null;

    if (type === "word") {
      await prisma.userWordProgress.updateMany({
        where: {
          userId,
          wordId: decodedId,
        },
        data: {
          wrongCount: 0,
          masteryLevel: 3,
          lastReviewTime: new Date(),
        },
      });
    }

    await writeAuditLog({
      userId,
      action: "resolve",
      resource: "weakness",
      refId: `${type}:${decodedId}`,
      metadata: {
        type,
        id: decodedId,
        reason,
      },
      request,
    });

    return apiSuccess({
      success: true,
      type,
      id: decodedId,
      status: "resolved",
    });
  } catch (error) {
    return handleApiError(error, request);
  }
}
