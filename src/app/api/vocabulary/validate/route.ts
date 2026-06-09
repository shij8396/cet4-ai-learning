import { NextResponse } from "next/server";
import { z } from "zod";

import { parseJsonArray } from "@/lib/json-array";
import { prisma } from "@/lib/prisma";
import { validateContent, getCacheStatus, getLookupForms } from "@/lib/vocabulary-validator";
import { loadWordCache } from "@/lib/vocabulary-validator/vocabulary-cache";

const validateSchema = z.object({
  text: z.string().min(1, "文本不能为空").max(50000, "文本过长"),
  allowedLevels: z.array(z.string()).optional(),
  checkLemmas: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = validateSchema.safeParse(body);

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

    const result = validateContent(parsed.data.text, {
      allowedLevels: parsed.data.allowedLevels,
      checkLemmas: parsed.data.checkLemmas,
    });

    const text = parsed.data.text.trim();
    if (text && !text.includes(" ")) {
      const lookupForms = getLookupForms(text);
      const wordRecords = await prisma.word.findMany({
        where: { word: { in: lookupForms } },
      });
      const wordRecord = lookupForms
        .map((form) => wordRecords.find((record) => record.word === form))
        .find(Boolean);

      if (wordRecord) {
        return NextResponse.json({
          ...result,
          phonetic: wordRecord.phonetic,
          meaning: wordRecord.meaning,
          partOfSpeech: wordRecord.partOfSpeech,
          example: wordRecord.example,
          exampleCn: wordRecord.exampleCn,
          tags: parseJsonArray(wordRecord.tags),
          isInCET4: true,
          lemma: wordRecord.word !== text.toLowerCase() ? wordRecord.word : undefined,
        });
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "服务器错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
