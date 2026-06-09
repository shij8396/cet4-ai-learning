"use client";

import { motion } from "framer-motion";
import { Award, Lock } from "lucide-react";
import { useState, useEffect } from "react";

import { Header } from "@/components/layout/Header";
import { staggerChildren, staggerItem } from "@/components/shared/PageTransition";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import type { AchievementDef } from "@/features/achievements/achievementDefs";

interface AchievementWithProgress extends AchievementDef {
  progress: number;
  isUnlocked: boolean;
  unlockedAt: string | null;
}

export default function AchievementsPage() {
  const [data, setData] = useState<{
    achievements: AchievementWithProgress[];
    unlockedCount: number;
    totalCount: number;
    completionRate: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/achievements")
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
        <Header title="成就" />
        <div className="max-w-lg mx-auto p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen pb-20">
        <Header title="成就" />
        <div className="max-w-lg mx-auto p-4 text-center py-16 text-muted-foreground">
          暂无成就数据
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Header title="成就殿堂" />

      <motion.div
        className="max-w-lg mx-auto p-4 space-y-4"
        variants={staggerChildren}
        initial="initial"
        animate="animate"
      >
        <motion.div
          variants={staggerItem}
          className="bg-card border rounded-xl p-4 text-center space-y-2"
        >
          <Award className="h-8 w-8 mx-auto text-amber-500" />
          <p className="text-2xl font-bold">
            {data.unlockedCount}/{data.totalCount}
          </p>
          <p className="text-sm text-muted-foreground">成就完成率 {data.completionRate}%</p>
          <Progress value={data.completionRate} className="h-1.5" />
        </motion.div>

        <motion.div className="space-y-2" variants={staggerChildren}>
          {data.achievements.map((ach) => (
            <motion.div
              key={ach.key}
              variants={staggerItem}
              whileHover={{ scale: 1.01 }}
              className="relative"
            >
              <Card
                className={`p-4 flex items-center gap-4 transition-all ${
                  ach.isUnlocked
                    ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20"
                    : "opacity-75"
                }`}
              >
                <motion.span
                  className="text-2xl shrink-0"
                  animate={ach.isUnlocked ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.5, repeat: 0 }}
                >
                  {ach.isUnlocked ? ach.icon : <Lock className="h-5 w-5 text-muted-foreground" />}
                </motion.span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{ach.name}</p>
                    {ach.isUnlocked && (
                      <Badge variant="secondary" className="text-[10px] h-4 px-1">
                        ✓
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{ach.description}</p>
                  <div className="mt-1.5 space-y-1">
                    <Progress
                      value={(ach.progress / ach.requirement) * 100}
                      className={`h-1 ${ach.isUnlocked ? "[&>div]:bg-emerald-500" : ""}`}
                    />
                    <p className="text-[10px] text-muted-foreground text-right">
                      {ach.progress}/{ach.requirement} · +{ach.xpReward} XP
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
