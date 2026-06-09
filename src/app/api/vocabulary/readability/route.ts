import { NextResponse } from "next/server";
import { z } from "zod";

import { analyzeReadability, getCacheStatus } from "@/lib/vocabulary-validator";
import { loadWordCache } from "@/lib/vocabulary-validator/vocabulary-cache";

const readabilitySchema = z.object({
  text: z.string().min(1, "文本不能为空").max(50000, "文本过长"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = readabilitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "参数校验失败", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const cacheStatus = getCacheStatus();
    if (!cacheStatus.isLoaded) {
      await loadWordCache();
    }

    const result = analyzeReadability(parsed.data.text);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "服务器错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
