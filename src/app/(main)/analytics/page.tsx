"use client";

import { motion } from "framer-motion";
import { BookOpen, Pencil, FileText, PenTool, Clock, TrendingUp, Target, Zap } from "lucide-react";
import { useState, useEffect } from "react";

import { Header } from "@/components/layout/Header";
import { staggerChildren, staggerItem } from "@/components/shared/PageTransition";

interface AnalyticsData {
  today: {
    wordsLearned: number;
    wordsReviewed: number;
    articlesRead: number;
    dictations: number;
    writingCount: number;
    studyMinutes: number;
    xpGained: number;
  };
  user: {
    masteredWords: number;
    totalWords: number;
    streak: number;
    level: number;
    xp: number;
  };
  totals: {
    wordsLearned: number;
    wordsReviewed: number;
    articlesRead: number;
    dictations: number;
    writingCount: number;
    studyMinutes: number;
    xpGained: number;
  };
  history: Array<{
    date: string;
    studyMinutes: number;
    xpGained: number;
    wordsLearned: number;
  }>;
}

function HeatmapCell({ date, value, maxValue }: { date: string; value: number; maxValue: number }) {
  const intensity = maxValue > 0 ? value / maxValue : 0;
  let bgClass = "bg-muted/30";

  if (intensity > 0) {
    if (intensity < 0.25) bgClass = "bg-emerald-200 dark:bg-emerald-900/50";
    else if (intensity < 0.5) bgClass = "bg-emerald-300 dark:bg-emerald-800/60";
    else if (intensity < 0.75) bgClass = "bg-emerald-400 dark:bg-emerald-700/70";
    else bgClass = "bg-emerald-500 dark:bg-emerald-600/80";
  }

  return (
    <div
      className={`w-3 h-3 rounded-sm ${bgClass} transition-colors`}
      title={`${date}: ${value}分钟`}
    />
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics?days=90")
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setData(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen pb-20">
        <Header title="学习统计" />
        <div className="max-w-lg mx-auto p-4 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen pb-20">
        <Header title="学习统计" />
        <div className="max-w-lg mx-auto p-4 text-center py-16 text-muted-foreground">
          暂无数据，开始学习吧！
        </div>
      </div>
    );
  }

  const { today, user, totals, history } = data;
  const maxMinutes = Math.max(...history.map((h) => h.studyMinutes), 1);
  const last90Days = history.slice(-90);

  return (
    <div className="min-h-screen pb-20">
      <Header title="学习统计" />

      <motion.div
        className="max-w-lg mx-auto p-4 space-y-4"
        variants={staggerChildren}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={staggerItem} className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<BookOpen className="h-5 w-5 text-blue-500" />}
            label="掌握词汇"
            value={user.masteredWords.toString()}
            sub={`总词汇 ${user.totalWords}`}
          />
          <StatCard
            icon={<Zap className="h-5 w-5 text-amber-500" />}
            label="总经验值"
            value={`${user.xp} XP`}
            sub={`等级 ${user.level}`}
          />
          <StatCard
            icon={<Target className="h-5 w-5 text-emerald-500" />}
            label="连续学习"
            value={`${user.streak}`}
            sub="天"
          />
          <StatCard
            icon={<Clock className="h-5 w-5 text-purple-500" />}
            label="总学习时长"
            value={`${Math.floor(totals.studyMinutes / 60)}h ${totals.studyMinutes % 60}m`}
            sub={`今日 ${today.studyMinutes}分钟`}
          />
        </motion.div>

        <motion.div variants={staggerItem} className="grid grid-cols-3 gap-2">
          <MiniStat label="今日单词" value={today.wordsLearned} />
          <MiniStat label="今日阅读" value={today.articlesRead} />
          <MiniStat label="今日默写" value={today.dictations} />
        </motion.div>

        <motion.div variants={staggerItem} className="bg-card border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              学习热力图
            </h3>
            <span className="text-xs text-muted-foreground">最近90天</span>
          </div>

          <div className="flex flex-wrap gap-1">
            {last90Days.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">暂无数据</p>
            ) : (
              last90Days.map((day) => (
                <HeatmapCell
                  key={day.date}
                  date={day.date}
                  value={day.studyMinutes}
                  maxValue={maxMinutes}
                />
              ))
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground justify-end">
            <span>少</span>
            <div className="w-3 h-3 rounded-sm bg-muted/30" />
            <div className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-900/50" />
            <div className="w-3 h-3 rounded-sm bg-emerald-300 dark:bg-emerald-800/60" />
            <div className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-700/70" />
            <div className="w-3 h-3 rounded-sm bg-emerald-500 dark:bg-emerald-600/80" />
            <span>多</span>
          </div>
        </motion.div>

        <motion.div variants={staggerItem} className="bg-card border rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold">累计统计</h3>
          <div className="space-y-2">
            <ProgressRow
              icon={<BookOpen className="h-4 w-4" />}
              label="累计学词"
              value={totals.wordsLearned}
            />
            <ProgressRow
              icon={<FileText className="h-4 w-4" />}
              label="阅读文章"
              value={totals.articlesRead}
            />
            <ProgressRow
              icon={<Pencil className="h-4 w-4" />}
              label="默写次数"
              value={totals.dictations}
            />
            <ProgressRow
              icon={<PenTool className="h-4 w-4" />}
              label="作文字数"
              value={totals.writingCount}
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="bg-card border rounded-xl p-4 space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card border rounded-xl p-3 text-center">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function ProgressRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-sm flex-1">{label}</span>
      <span className="text-sm font-semibold tabular-nums">{value.toLocaleString()}</span>
    </div>
  );
}
