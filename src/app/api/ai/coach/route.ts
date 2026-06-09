import { NextResponse } from "next/server";
import { z } from "zod";

import { getWritingCoachSuggestions } from "@/services/ai";

const schema = z.object({
  originalText: z.string().min(1).max(2000),
  mode: z.enum(["expression", "replacement", "structure", "simplify"]),
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

    const result = await getWritingCoachSuggestions(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "服务器错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
