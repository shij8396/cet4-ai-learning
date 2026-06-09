"use client";

import { BookOpen, Home } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <div className="rounded-full bg-muted p-4 mb-6">
        <BookOpen className="h-12 w-12 text-muted-foreground" />
      </div>
      <h1 className="text-6xl font-bold mb-2 text-muted-foreground">404</h1>
      <h2 className="text-xl font-semibold mb-2">页面未找到</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        您访问的页面不存在或已被移除。请检查链接是否正确。
      </p>
      <Button asChild>
        <Link href="/">
          <Home className="h-4 w-4 mr-2" />
          返回首页
        </Link>
      </Button>
    </div>
  );
}
