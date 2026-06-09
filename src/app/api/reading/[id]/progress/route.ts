import { NextResponse } from "next/server";
import { z } from "zod";

import { READING_ARTICLES } from "@/features/reading/data/articles";
import { getAuthUserIdOrError, handleApiError } from "@/lib/api-helpers";

const progressSchema = z.object({
  progress: z.number().min(0).max(100).optional(),
  readTime: z.number().int().min(0).optional(),
  clickedWords: z.array(z.string()).optional(),
  unknownWords: z.array(z.string()).optional(),
  isCompleted: z.boolean().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getAuthUserIdOrError();
    const { id } = await params;

    const article = READING_ARTICLES.find((a) => a.id === id);
    if (!article) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = progressSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "参数校验失败", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      ...parsed.data,
      articleId: id,
      userId,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
