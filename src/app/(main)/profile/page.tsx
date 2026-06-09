"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  Flame,
  Target,
  TrendingUp,
  Clock,
  Award,
  Settings,
  LogOut,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Header } from "@/components/layout/Header";
import { staggerChildren, staggerItem } from "@/components/shared/PageTransition";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function ProfilePage() {
  const [stats, setStats] = useState<{
    user: { masteredWords: number; totalWords: number; streak: number; level: number; xp: number };
    totals: {
      wordsLearned: number;
      articlesRead: number;
      dictations: number;
      writingCount: number;
      studyMinutes: number;
    };
  } | null>(null);

  const [checkIn, setCheckIn] = useState<{
    checkedInToday: boolean;
    todayStreak: number;
  } | null>(null);

  useEffect(() => {
    fetch("/api/analytics?days=1")
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setStats(d);
      })
      .catch(() => {});
    fetch("/api/checkin")
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setCheckIn(d);
      })
      .catch(() => {});
  }, []);

  const handleCheckIn = async () => {
    try {
      const res = await fetch("/api/checkin", { method: "POST" });
      const data = await res.json();
      if (data.checkedIn) {
        toast.success(`打卡成功！🔥 连续 ${data.streak} 天`, {
          description: `获得 ${data.xpBonus} XP 奖励`,
        });
        setCheckIn({ checkedInToday: true, todayStreak: data.streak });
      } else if (data.alreadyCheckedIn) {
        toast("今日已打卡");
      }
    } catch {
      toast.error("打卡失败，请重试");
    }
  };

  const user = stats?.user;
  const totals = stats?.totals;
  const levelXp = (user?.level || 1) * 500;
  const currentXp = user?.xp || 0;
  const xpProgress = Math.min(((currentXp % 500) / 500) * 100, 100);

  if (!stats) {
    return (
      <div className="min-h-screen pb-20">
        <Header title="我的" />
        <div className="max-w-lg mx-auto p-4 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Header title="我的" />

      <motion.div
        className="max-w-lg mx-auto p-4 space-y-4"
        variants={staggerChildren}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={staggerItem}>
          <Card className="p-5 text-center space-y-3 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/40 dark:to-purple-950/40 border-0">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold">
                {checkIn?.checkedInToday ? "✅ 今日已打卡" : "今日打卡"}
              </p>
              <p className="text-sm text-muted-foreground">
                {checkIn?.checkedInToday
                  ? `连续 ${checkIn.todayStreak} 天 · 继续加油！`
                  : "完成打卡获得XP奖励"}
              </p>
            </div>
            <Button
              onClick={handleCheckIn}
              disabled={checkIn?.checkedInToday}
              size="sm"
              className={checkIn?.checkedInToday ? "opacity-50" : ""}
            >
              {checkIn?.checkedInToday ? "已打卡" : "🎯 打卡学习"}
            </Button>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem} className="grid grid-cols-3 gap-2">
          <MiniStatCard
            icon={<Flame className="h-4 w-4 text-orange-500" />}
            label="连续"
            value={user?.streak || 0}
            unit="天"
          />
          <MiniStatCard
            icon={<BookOpen className="h-4 w-4 text-blue-500" />}
            label="掌握"
            value={user?.masteredWords || 0}
            unit="词"
          />
          <MiniStatCard
            icon={<Target className="h-4 w-4 text-emerald-500" />}
            label="等级"
            value={user?.level || 1}
            unit=""
          />
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">经验值</span>
              <span className="font-semibold">
                {currentXp} / {levelXp} XP
              </span>
            </div>
            <Progress value={xpProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              再获得 {500 - (currentXp % 500)} XP 升级到 Lv.{(user?.level || 1) + 1}
            </p>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem} className="grid grid-cols-2 gap-3">
          <Link href="/analytics">
            <Card className="p-4 hover:bg-muted/30 transition-colors cursor-pointer">
              <TrendingUp className="h-5 w-5 text-blue-500 mb-2" />
              <p className="text-sm font-medium">学习统计</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {totals?.studyMinutes || 0}分钟
              </p>
            </Card>
          </Link>

          <Link href="/achievements">
            <Card className="p-4 hover:bg-muted/30 transition-colors cursor-pointer">
              <Award className="h-5 w-5 text-amber-500 mb-2" />
              <p className="text-sm font-medium">成就殿堂</p>
              <p className="text-xs text-muted-foreground mt-0.5">{user?.xp || 0} XP</p>
            </Card>
          </Link>

          <Link href="/settings">
            <Card className="p-4 hover:bg-muted/30 transition-colors cursor-pointer">
              <Settings className="h-5 w-5 text-slate-500 mb-2" />
              <p className="text-sm font-medium">设置</p>
              <p className="text-xs text-muted-foreground mt-0.5">偏好与提醒</p>
            </Card>
          </Link>

          <Card
            className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-5 w-5 text-red-500 mb-2" />
            <p className="text-sm font-medium">退出登录</p>
            <p className="text-xs text-muted-foreground mt-0.5">安全登出</p>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="p-4 space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              学习统计
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <span className="text-muted-foreground">已学单词</span>
              <span className="text-right font-medium">{totals?.wordsLearned || 0}</span>
              <span className="text-muted-foreground">阅读文章</span>
              <span className="text-right font-medium">{totals?.articlesRead || 0}</span>
              <span className="text-muted-foreground">默写次数</span>
              <span className="text-right font-medium">{totals?.dictations || 0}</span>
              <span className="text-muted-foreground">作文篇数</span>
              <span className="text-right font-medium">{totals?.writingCount || 0}</span>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}

function MiniStatCard({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <Card className="p-3 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-lg font-bold">
        {value}
        <span className="text-xs ml-0.5">{unit}</span>
      </p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </Card>
  );
}
