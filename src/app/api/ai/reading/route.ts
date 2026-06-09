import { NextResponse } from "next/server";
import { z } from "zod";

import { generateReading } from "@/services/ai";
import { getFromCache, setCache, getCacheKey } from "@/services/ai/cache";

const schema = z.object({
  level: z.number().int().min(1).max(5).optional(),
  topic: z.string().max(100).optional(),
  wordCount: z.number().int().min(50).max(500).optional(),
  newWordRatio: z.number().min(0).max(0.5).optional(),
  knownWords: z.array(z.string()).optional(),
  includeQuestions: z.boolean().optional(),
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

    const cacheKey = getCacheKey("reading", parsed.data as Record<string, unknown>);
    const cached = getFromCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const result = await generateReading(parsed.data);
    setCache(cacheKey, result, 60 * 60 * 1000);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "服务器错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
