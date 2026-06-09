"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  Pencil,
  PenTool,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStudyStore } from "@/stores";

import type { TodayDashboard, WeaknessItem } from "@/features/study/services/studyDashboard";

const taskIcons = {
  words: BookOpen,
  reading: FileText,
  dictation: Pencil,
  writing: PenTool,
};

const statusText = {
  done: "已完成",
  active: "进行中",
  pending: "未开始",
};

const fallbackDashboard: TodayDashboard = {
  summary: {
    wordsLearned: 0,
    wordsReviewed: 0,
    articlesRead: 0,
    dictations: 0,
    writingCount: 0,
    studyMinutes: 0,
    weakPointCount: 0,
    completedTasks: 0,
    totalTasks: 4,
  },
  tasks: [
    {
      type: "words",
      title: "单词学习",
      description: "新学与复习合计 100 个",
      href: "/learn",
      target: 100,
      current: 0,
      progress: 0,
      status: "pending",
    },
    {
      type: "reading",
      title: "阅读训练",
      description: "完成 1 篇分级阅读",
      href: "/reading",
      target: 1,
      current: 0,
      progress: 0,
      status: "pending",
    },
    {
      type: "dictation",
      title: "默写练习",
      description: "完成 1 组真实词库默写",
      href: "/dictation",
      target: 1,
      current: 0,
      progress: 0,
      status: "pending",
    },
    {
      type: "writing",
      title: "作文练习",
      description: "完成 1 篇四级作文",
      href: "/writing",
      target: 1,
      current: 0,
      progress: 0,
      status: "pending",
    },
  ],
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.18 } },
};

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { todayWordsLearned, todayWordsReviewed, todayStudyMinutes } = useStudyStore();
  const [dashboard, setDashboard] = useState<TodayDashboard>(fallbackDashboard);
  const [weaknessItems, setWeaknessItems] = useState<WeaknessItem[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;

    async function loadDashboard() {
      const [todayResponse, weaknessResponse] = await Promise.all([
        fetch("/api/dashboard/today"),
        fetch("/api/weakness"),
      ]);

      if (cancelled) return;

      if (todayResponse.ok) {
        setDashboard(await todayResponse.json());
      }

      if (weaknessResponse.ok) {
        const data = (await weaknessResponse.json()) as { items?: WeaknessItem[] };
        setWeaknessItems(data.items ?? []);
      }
    }

    loadDashboard().catch(() => {
      if (!cancelled) setDashboard(fallbackDashboard);
    });

    return () => {
      cancelled = true;
    };
  }, [status]);

  const summary = useMemo(() => {
    const serverSummary = dashboard.summary;
    return {
      ...serverSummary,
      wordsLearned: Math.max(serverSummary.wordsLearned, todayWordsLearned),
      wordsReviewed: Math.max(serverSummary.wordsReviewed, todayWordsReviewed),
      studyMinutes: Math.max(serverSummary.studyMinutes, todayStudyMinutes),
    };
  }, [dashboard.summary, todayStudyMinutes, todayWordsLearned, todayWordsReviewed]);

  if (status === "loading" || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <Header title="今日任务台" />
      <motion.div
        className="mx-auto max-w-lg space-y-4 p-4"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
      >
        <motion.div variants={itemVariants}>
          <Card className="border-0 bg-primary/10">
            <CardContent className="py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {session.user?.name || "同学"}，今天继续推进四级闭环
                  </p>
                  <h2 className="mt-1 text-2xl font-bold">
                    {summary.completedTasks}/{summary.totalTasks} 项已完成
                  </h2>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-background/80">
                  <Target className="h-5 w-5 text-primary" />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-background/70 p-2">
                  <p className="text-lg font-semibold">{summary.wordsLearned}</p>
                  <p className="text-[11px] text-muted-foreground">新学</p>
                </div>
                <div className="rounded-lg bg-background/70 p-2">
                  <p className="text-lg font-semibold">{summary.wordsReviewed}</p>
                  <p className="text-[11px] text-muted-foreground">复习</p>
                </div>
                <div className="rounded-lg bg-background/70 p-2">
                  <p className="text-lg font-semibold">{summary.studyMinutes}</p>
                  <p className="text-[11px] text-muted-foreground">分钟</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-2">
          {dashboard.tasks.map((task) => {
            const Icon = taskIcons[task.type];
            return (
              <Link key={task.type} href={task.href} className="block">
                <Card className="active:scale-[0.99]">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-semibold">{task.title}</h3>
                        <Badge variant={task.status === "done" ? "default" : "secondary"}>
                          {statusText[task.status]}
                        </Badge>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {task.description}
                      </p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>
                    {task.status === "done" ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  薄弱点中心
                </span>
                <Badge variant="secondary">{summary.weakPointCount || weaknessItems.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {weaknessItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  暂无集中薄弱点，完成练习后会自动汇总。
                </p>
              ) : (
                weaknessItems.slice(0, 5).map((item) => (
                  <Link key={item.id} href={item.actionHref} className="block">
                    <div className="flex items-center gap-3 rounded-lg border p-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {item.sources.join(" / ")}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))
              )}
              <Button variant="outline" className="w-full" asChild>
                <Link href="/weakness">
                  查看全部薄弱点
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex items-center gap-2 text-xs text-muted-foreground"
        >
          <Clock3 className="h-3.5 w-3.5" />
          数据来自今日学习记录，本地模式下会在练习完成后同步更新。
        </motion.div>
      </motion.div>
    </div>
  );
}
