"use client";

import { AlertTriangle, ArrowRight, CheckCircle2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import type { WeaknessItem } from "@/features/study/services/studyDashboard";

export default function WeaknessPage() {
  const [items, setItems] = useState<WeaknessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  async function loadItems() {
    setLoading(true);
    try {
      const response = await fetch("/api/weakness");
      if (response.ok) {
        const data = (await response.json()) as { items?: WeaknessItem[] };
        setItems(data.items ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function resolveItem(item: WeaknessItem) {
    setResolvingId(item.id);
    try {
      await fetch(`/api/weakness/${item.type}/${encodeURIComponent(item.refId)}/resolve`, {
        method: "POST",
      });
      setItems((current) => current.filter((candidate) => candidate.id !== item.id));
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <div>
      <Header title="薄弱点中心" showBack />
      <div className="mx-auto max-w-lg space-y-3 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">汇总错词、生词、默写错误和作文问题词。</p>
          <Button variant="ghost" size="icon" onClick={loadItems} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="h-12 w-12" />}
            title="暂无待处理薄弱点"
            description="继续完成单词、阅读、默写和作文练习，系统会自动归集。"
          />
        ) : (
          items.map((item) => (
            <Card key={item.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold">{item.title}</h3>
                      <Badge variant="secondary">优先级 {item.priority}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.sources.map((source) => (
                        <Badge key={source} variant="outline">
                          {source}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1" asChild>
                    <Link href={item.actionHref}>
                      去复习
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => resolveItem(item)}
                    disabled={resolvingId === item.id}
                  >
                    已处理
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
