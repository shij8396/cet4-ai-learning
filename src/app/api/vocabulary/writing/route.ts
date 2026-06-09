import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { parseJsonArray, stringifyJsonArray } from "@/lib/json-array";
import { prisma } from "@/lib/prisma";
import { validateWriting, getCacheStatus } from "@/lib/vocabulary-validator";
import { loadWordCache } from "@/lib/vocabulary-validator/vocabulary-cache";

const saveWritingSchema = z.object({
  title: z.string().optional(),
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const record = await prisma.writingRecord.findUnique({
        where: { id, userId: session.user.id },
        include: { suggestions: true },
      });

      if (!record) {
        return NextResponse.json({ error: "记录不存在" }, { status: 404 });
      }

      return NextResponse.json({
        ...record,
        outOfLevelWords: parseJsonArray(record.outOfLevelWords),
      });
    }

    const records = await prisma.writingRecord.findMany({
      where: { userId: session.user.id },
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

    const formatted = records.map((r) => ({
      id: r.id,
      title: r.title || "未命名作文",
      content: r.content,
      score: r.score,
      createdAt: r.createdAt.toISOString(),
      wordCount: r.content.split(/[^a-zA-Z]+/).filter((w) => w.length >= 2).length,
    }));

    return NextResponse.json({ records: formatted });
  } catch (error) {
    const message = error instanceof Error ? error.message : "服务器错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();

    const validateResult = validateSchema.safeParse(body);
    if (validateResult.success) {
      const cacheStatus = getCacheStatus();
      if (!cacheStatus.isLoaded) {
        await loadWordCache();
      }

      const result = validateWriting(validateResult.data.text, {
        allowedLevels: validateResult.data.allowedLevels,
        maxRepeatedWords: validateResult.data.maxRepeatedWords,
      });

      return NextResponse.json(result);
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const parsed = saveWritingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "参数校验失败", details: parsed.error.flatten() },
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
        userId: session.user.id,
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
    const message = error instanceof Error ? error.message : "服务器错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
