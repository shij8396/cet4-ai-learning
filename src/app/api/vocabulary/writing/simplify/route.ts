import { NextResponse } from "next/server";
import { z } from "zod";

import { simplifyText } from "@/features/writing/utils/writingAssistant";

const requestSchema = z.object({
  originalText: z.string().min(1, "请输入文本").max(2000, "文本过长"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "参数校验失败", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = simplifyText(parsed.data);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "服务器错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
