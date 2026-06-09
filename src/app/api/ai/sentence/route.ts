import { NextResponse } from "next/server";
import { z } from "zod";

import { generateSentences } from "@/services/ai";
import { getFromCache, setCache, getCacheKey } from "@/services/ai/cache";

const schema = z.object({
  word: z.string().min(1).max(50),
  level: z.number().int().min(1).max(5).optional(),
  topic: z.string().max(100).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "参数校验失败", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const cacheKey = getCacheKey("sentence", parsed.data as Record<string, unknown>);
    const cached = getFromCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const result = await generateSentences(parsed.data);
    setCache(cacheKey, result, 30 * 60 * 1000);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "服务器错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
