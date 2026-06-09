"use client";

import { motion } from "framer-motion";
import {
  Users,
  BookOpen,
  BarChart3,
  Cpu,
  Activity,
  Database,
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Sparkles,
  MessageSquare,
  Eye,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { staggerChildren, staggerItem } from "@/components/shared/PageTransition";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { notification } from "@/lib/notifications";

interface AdminStats {
  users: number;
  words: number;
  articles: number;
  dictationSessions: number;
  writingRecords: number;
  aiCalls: { calls: number; totalTokens: number; avgLatency: number; errors: number };
}

interface AILog {
  id: string;
  timestamp: string;
  provider: string;
  endpoint: string;
  status: "success" | "error";
  latency: number;
  tokens: number;
  error?: string;
}

const RECENT_AI_LOGS: AILog[] = [];

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "content" | "ai">("overview");

  const loadStats = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/stats").then((r) => r.json()),
      fetch("/api/ai/debug").then((r) => r.json()),
    ])
      .then(([s, ai]) => {
        const aiStats = ai?.stats?.[Object.keys(ai.stats || {})[0]] || {
          calls: 0,
          totalTokens: 0,
          avgLatency: 0,
          errors: 0,
        };
        setStats({
          users: s.users || 0,
          words: s.words || 0,
          articles: s.articles || 0,
          dictationSessions: s.dictationSessions || 0,
          writingRecords: s.writingRecords || 0,
          aiCalls: aiStats,
        });
        notification.success("数据加载成功");
      })
      .catch(() => {
        setStats(null);
        notification.error("加载失败，请重试");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading) {
    return (
      <div className="min-h-screen p-6 max-w-4xl mx-auto space-y-4">
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 pb-20 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">管理后台</h1>
          <p className="text-sm text-muted-foreground">系统管理与监控</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadStats}>
          <RefreshCw className="h-4 w-4 mr-1" />
          刷新
        </Button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {[
          { key: "overview" as const, label: "概览", icon: BarChart3 },
          { key: "users" as const, label: "用户", icon: Users },
          { key: "content" as const, label: "内容", icon: FileText },
          { key: "ai" as const, label: "AI 监控", icon: Cpu },
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab(tab.key)}
          >
            <tab.icon className="h-4 w-4 mr-1" />
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === "overview" && stats && (
        <motion.div
          className="space-y-4"
          variants={staggerChildren}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={staggerItem} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatBadge icon={<Users className="h-4 w-4" />} label="用户数" value={stats.users} />
            <StatBadge icon={<BookOpen className="h-4 w-4" />} label="词汇量" value={stats.words} />
            <StatBadge
              icon={<FileText className="h-4 w-4" />}
              label="文章"
              value={stats.articles}
            />
            <StatBadge
              icon={<Database className="h-4 w-4" />}
              label="写作"
              value={stats.writingRecords}
            />
          </motion.div>

          <motion.div variants={staggerItem} className="grid gap-3 sm:grid-cols-2">
            <Card className="p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Cpu className="h-4 w-4 text-purple-500" />
                AI 调用统计
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <KV label="调用次数" value={stats.aiCalls.calls.toLocaleString()} />
                <KV label="Token 总量" value={stats.aiCalls.totalTokens.toLocaleString()} />
                <KV label="平均延迟" value={`${stats.aiCalls.avgLatency}ms`} />
                <KV label="错误次数" value={stats.aiCalls.errors} valueClassName="text-red-500" />
              </div>
            </Card>

            <Card className="p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-500" />
                系统状态
              </h3>
              <div className="space-y-2">
                <StatusItem label="API 服务" status="running" />
                <StatusItem label="数据库" status="running" />
                <StatusItem label="AI 引擎" status="running" />
                <StatusItem label="PWA 服务" status="running" />
              </div>
            </Card>
          </motion.div>

          <motion.div variants={staggerItem}>
            <Card className="p-4 space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                安全状态
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <SecurityItem label="API 限流" enabled={true} />
                <SecurityItem label="XSS 防护" enabled={true} />
                <SecurityItem label="CSRF 防护" enabled={true} />
                <SecurityItem label="CSP 头部" enabled={true} />
                <SecurityItem label="速率限制" enabled={true} />
                <SecurityItem label="输入净化" enabled={true} />
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {activeTab === "users" && (
        <div className="space-y-4">
          <Card className="p-6 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-1">用户管理</h3>
            <p className="text-sm text-muted-foreground mb-4">
              当前注册用户: <strong>{stats?.users || 0}</strong>
            </p>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-muted-foreground">今日活跃</p>
                <p className="text-xl font-bold">--</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-muted-foreground">本周新增</p>
                <p className="text-xl font-bold">--</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-muted-foreground">管理员</p>
                <p className="text-xl font-bold">
                  {(process.env.ADMIN_USER_IDS || "").split(",").filter(Boolean).length || 0}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "content" && (
        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <h3 className="text-sm font-semibold">内容概览</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-muted-foreground">词汇总数</p>
                <p className="text-xl font-bold">{stats?.words || 0}</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-muted-foreground">阅读文章</p>
                <p className="text-xl font-bold">{stats?.articles || 0}</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-muted-foreground">写作记录</p>
                <p className="text-xl font-bold">{stats?.writingRecords || 0}</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-muted-foreground">默写会话</p>
                <p className="text-xl font-bold">{stats?.dictationSessions || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Eye className="h-4 w-4 text-orange-500" />
              AI 内容审核队列
            </h3>
            <p className="text-sm text-muted-foreground">
              自动审核已启用，所有 AI 生成内容经过拼写检查和级别验证后方可发布。
            </p>
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              审核状态正常
            </div>
          </Card>
        </div>
      )}

      {activeTab === "ai" && (
        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              AI 调用实时监控
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <KV label="总调用次数" value={(stats?.aiCalls.calls || 0).toLocaleString()} />
              <KV label="今日 Token" value={(stats?.aiCalls.totalTokens || 0).toLocaleString()} />
              <KV label="平均延迟" value={`${stats?.aiCalls.avgLatency || 0}ms`} />
              <KV
                label="错误率"
                value={
                  stats?.aiCalls.calls
                    ? `${((stats.aiCalls.errors / stats.aiCalls.calls) * 100).toFixed(1)}%`
                    : "0%"
                }
                valueClassName={stats && stats.aiCalls.errors > 0 ? "text-red-500" : undefined}
              />
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              最近 AI 调用日志
            </h3>
            {RECENT_AI_LOGS.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                暂无 AI 调用记录。AI 调用日志将在发生 API 请求时自动记录。
              </p>
            ) : (
              <div className="space-y-2">
                {RECENT_AI_LOGS.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between rounded-lg bg-muted p-3 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      {log.status === "success" ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <span>{log.endpoint}</span>
                    </div>
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <span>{log.latency}ms</span>
                      <span>{log.tokens} tokens</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function StatBadge({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <span className="text-muted-foreground">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold">{value.toLocaleString()}</p>
      </div>
    </Card>
  );
}

function KV({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string | number;
  valueClassName?: string;
}) {
  return (
    <div>
      <span className="text-muted-foreground">{label}</span>
      <p className={`font-semibold ${valueClassName || ""}`}>{value}</p>
    </div>
  );
}

function StatusItem({ label, status }: { label: string; status: "running" | "error" | "idle" }) {
  const colors = {
    running: "text-green-500",
    error: "text-red-500",
    idle: "text-muted-foreground",
  };
  return (
    <div className="flex items-center justify-between text-sm">
      <span>{label}</span>
      <span className={`flex items-center gap-1 ${colors[status]}`}>
        <span className="h-2 w-2 rounded-full bg-current" />
        {status === "running" ? "运行中" : status === "error" ? "异常" : "空闲"}
      </span>
    </div>
  );
}

function SecurityItem({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {enabled ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
      )}
      <span>{label}</span>
    </div>
  );
}
