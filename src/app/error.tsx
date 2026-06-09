"use client";

import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="zh-CN">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <div className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
          <div className="rounded-full bg-destructive/10 p-4 mb-6">
            <AlertTriangle className="h-16 w-16 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">系统错误</h1>
          <p className="text-muted-foreground mb-6 max-w-md">
            很抱歉，系统遇到了严重错误。请尝试刷新页面，如果问题持续存在请联系技术支持。
          </p>
          {process.env.NODE_ENV === "development" && (
            <div className="mb-6 max-w-md rounded-lg bg-muted p-4 text-left">
              <p className="text-sm font-mono text-destructive break-all">{error.message}</p>
              {error.digest && (
                <p className="text-xs text-muted-foreground mt-2">Digest: {error.digest}</p>
              )}
            </div>
          )}
          <div className="flex gap-3">
            <Button onClick={reset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              重试
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                返回首页
              </Link>
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
