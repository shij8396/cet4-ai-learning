import { NextResponse } from "next/server";
import { z } from "zod";

import { READING_ARTICLES } from "@/features/reading/data/articles";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  level: z.coerce.number().int().min(1).max(5).optional(),
  tag: z.string().optional(),
  recommended: z.coerce.boolean().optional(),
});

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawParams = Object.fromEntries(searchParams.entries());

  const parsed = querySchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json({ error: "参数校验失败" }, { status: 400 });
  }

  const { page, limit, level, tag } = parsed.data;

  let filtered = [...READING_ARTICLES];

  if (level) {
    filtered = filtered.filter((a) => a.level === level);
  }

  if (tag) {
    filtered = filtered.filter((a) =>
      a.tags.some((t) => t.toLowerCase().includes(tag.toLowerCase())),
    );
  }

  const total = filtered.length;
  const skip = (page - 1) * limit;
  const articles = filtered.slice(skip, skip + limit);

  return NextResponse.json({
    articles,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
