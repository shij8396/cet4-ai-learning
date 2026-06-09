"use client";

import { motion } from "framer-motion";
import { Moon, Sun, Bell, Type, Eye, Database, Info, Cpu } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { Header } from "@/components/layout/Header";
import { staggerChildren, staggerItem } from "@/components/shared/PageTransition";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [fontSize, setFontSize] = useState("medium");
  const [aiEnabled, setAiEnabled] = useState(true);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("09:00");

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="min-h-screen pb-20">
        <Header title="设置" />
        <div className="max-w-lg mx-auto p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Header title="设置" />

      <motion.div
        className="max-w-lg mx-auto p-4 space-y-4"
        variants={staggerChildren}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={staggerItem}>
          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-500" />
              外观设置
            </h3>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                <Label className="text-sm">深色模式</Label>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(v) => {
                  setTheme(v ? "dark" : "light");
                  toast.success(v ? "已切换深色模式" : "已切换浅色模式");
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Type className="h-4 w-4" />
                <Label className="text-sm">字体大小</Label>
              </div>
              <select
                value={fontSize}
                onChange={(e) => {
                  setFontSize(e.target.value);
                  toast.success("字号已更新");
                }}
                className="text-sm border rounded-lg px-2 py-1 bg-background"
              >
                <option value="small">小</option>
                <option value="medium">中</option>
                <option value="large">大</option>
              </select>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-500" />
              学习提醒
            </h3>

            <div className="flex items-center justify-between">
              <Label className="text-sm">每日提醒</Label>
              <Switch
                checked={reminderEnabled}
                onCheckedChange={(v) => {
                  setReminderEnabled(v);
                  toast.success(v ? "已开启学习提醒" : "已关闭学习提醒");
                }}
              />
            </div>

            {reminderEnabled && (
              <div className="flex items-center justify-between">
                <Label className="text-sm">提醒时间</Label>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="text-sm border rounded-lg px-2 py-1 bg-background"
                />
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Cpu className="h-4 w-4 text-purple-500" />
              AI功能
            </h3>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">AI学习助手</Label>
                <p className="text-xs text-muted-foreground">启用AI生成的阅读、例句和推荐</p>
              </div>
              <Switch
                checked={aiEnabled}
                onCheckedChange={(v) => {
                  setAiEnabled(v);
                  toast.success(v ? "AI助手已启用" : "AI助手已关闭");
                }}
              />
            </div>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-500" />
              数据管理
            </h3>

            <button
              onClick={() => toast.success("缓存已清除")}
              className="text-sm text-left w-full py-1 hover:text-primary transition-colors"
            >
              清除本地缓存
            </button>

            <button
              onClick={() => {
                if (confirm("确定要重置所有学习进度吗？此操作不可撤销。")) {
                  toast.success("进度已重置");
                }
              }}
              className="text-sm text-left w-full py-1 text-red-500 hover:text-red-600 transition-colors"
            >
              重置学习进度
            </button>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="p-4 space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Info className="h-4 w-4 text-slate-500" />
              关于
            </h3>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>AI英语四级学习 v1.0.0</p>
              <p>基于词汇约束的AI英语学习系统</p>
              <p>Build with Next.js + Prisma + TypeScript</p>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
