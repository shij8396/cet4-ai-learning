import { NextResponse } from "next/server";

import { READING_ARTICLES } from "@/features/reading/data/articles";

export function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return params.then(({ id }) => {
    const article = READING_ARTICLES.find((a) => a.id === id);

    if (!article) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    return NextResponse.json(article);
  });
}
