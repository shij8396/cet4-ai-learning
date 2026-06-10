import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError, enforceRateLimit, requireApiAuth, UnauthorizedError } from "@/lib/api-helpers";
import { parseJsonArray, stringifyJsonArray } from "@/lib/json-array";
import { prisma } from "@/lib/prisma";
import { validateWriting, getCacheStatus } from "@/lib/vocabulary-validator";
import { loadWordCache } from "@/lib/vocabulary-validator/vocabulary-cache";

const saveWritingSchema = z.object({
  title: z.string().max(120).optional(),
  content: z.string().min(1, "内容不能为空").max(10000, "文本过长"),
  score: z.number().min(0).max(100).optional(),
  grammarErrors: z.unknown().optional(),
  spellingErrors: z.unknown().optional(),
  outOfLevelWords: z.array(z.string()).optional(),
  vocabularyCoverage: z.number().min(0).max(1).optional(),
  writingTime: z.number().int().min(0).optional(),
});

const validateSchema = z.object({
  text: z.string().min(1, "文本不能为空").max(10000, "文本过长"),
  allowedLevels: z.array(z.string()).optional(),
  maxRepeatedWords: z.number().int().min(2).max(50).optional(),
});

export async function GET(request: Request) {
  try {
    const userId = await requireApiAuth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const record = await prisma.writingRecord.findFirst({
        where: { id, userId },
        include: { suggestions: true },
      });

      if (!record) {
        return NextResponse.json({ error: "记录不存在", code: "NOT_FOUND" }, { status: 404 });
      }

      return NextResponse.json({
        ...record,
        outOfLevelWords: parseJsonArray(record.outOfLevelWords),
      });
    }

    const records = await prisma.writingRecord.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        content: true,
        score: true,
        createdAt: true,
      },
    });

    const formatted = records.map((record) => ({
      id: record.id,
      title: record.title || "未命名作文",
      content: record.content,
      score: record.score,
      createdAt: record.createdAt.toISOString(),
      wordCount: record.content.split(/[^a-zA-Z]+/).filter((word) => word.length >= 2).length,
    }));

    return NextResponse.json({ records: formatted });
  } catch (error) {
    return apiError(error, 500, "INTERNAL_ERROR", request);
  }
}

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, {
    key: "writing",
    maxRequests: 60,
    windowMs: 60 * 1000,
  });
  if (limited) return limited;

  try {
    const body = await request.json();

    const validateResult = validateSchema.safeParse(body);
    if (validateResult.success && !("content" in body)) {
      const cacheStatus = getCacheStatus();
      if (!cacheStatus.isLoaded) {
        await loadWordCache();
      }

      const result = validateWriting(validateResult.data.text, {
        allowedLevels: validateResult.data.allowedLevels,
        maxRepeatedWords: validateResult.data.maxRepeatedWords,
      });

      return NextResponse.json({
        ...result,
        source: "rule",
        degraded: false,
      });
    }

    const userId = await requireApiAuth();
    const parsed = saveWritingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "参数校验失败", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const {
      title,
      content,
      score,
      grammarErrors,
      spellingErrors,
      outOfLevelWords,
      vocabularyCoverage,
      writingTime,
    } = parsed.data;

    const record = await prisma.writingRecord.create({
      data: {
        userId,
        title,
        content,
        score,
        grammarErrors: grammarErrors as object | undefined,
        spellingErrors: spellingErrors as object | undefined,
        outOfLevelWords: stringifyJsonArray(outOfLevelWords || []),
        vocabularyCoverage,
        writingTime,
      },
    });

    return NextResponse.json({ id: record.id });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return apiError(error, 401, "UNAUTHORIZED", request);
    }
    return apiError(error, 500, "INTERNAL_ERROR", request);
  }
}
