import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "cet4-ai-learning",
    timestamp: new Date().toISOString(),
  });
}
