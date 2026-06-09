"use client";

import {
  AlertTriangle,
  BarChart3,
  Clock,
  History,
  Lightbulb,
  PenTool,
  Save,
  Trash2,
  Wand2,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import {
  useAutoSave,
  useWritingAnalyzer,
  useWritingStore,
  WritingEditor,
} from "@/features/writing";

import type { HistoryRecord } from "@/features/writing/types";

const WritingSuggestions = dynamic(
  () =>
    import("@/features/writing/components/WritingSuggestions").then((m) => m.WritingSuggestions),
  { ssr: false, loading: () => <div className="h-32 animate-pulse rounded-xl bg-muted/30" /> },
);

const WritingAssistant = dynamic(
  () => import("@/features/writing/components/WritingAssistant").then((m) => m.WritingAssistant),
  { ssr: false, loading: () => <div className="h-48 animate-pulse rounded-xl bg-muted/30" /> },
);

const WritingSimplifier = dynamic(
  () => import("@/features/writing/components/WritingSimplifier").then((m) => m.WritingSimplifier),
  { ssr: false, loading: () => <div className="h-48 animate-pulse rounded-xl bg-muted/30" /> },
);

const WritingScoreCard = dynamic(
  () => import("@/features/writing/components/WritingScoreCard").then((m) => m.WritingScoreCard),
  { ssr: false, loading: () => <div className="h-40 animate-pulse rounded-xl bg-muted/30" /> },
);

const WritingHistory = dynamic(
  () => import("@/features/writing/components/WritingHistory").then((m) => m.WritingHistory),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-xl bg-muted/30" /> },
);

function formatSavedTime(lastSaved: number | null, now: number) {
  if (!lastSaved) return null;
  const diff = Math.floor((now - lastSaved) / 1000);
  if (diff < 10) return "刚刚";
  if (diff < 60) return `${diff} 秒前`;
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  return `${Math.floor(diff / 3600)} 小时前`;
}

export default function WritingPage() {
  const {
    title,
    content,
    lastAnalysis,
    score,
    coverageReport,
    showAssistant,
    showSimplifier,
    showScore,
    showHistory,
    history,
    setTitle,
    setContent,
    setShowAssistant,
    setShowSimplifier,
    setShowScore,
    setShowHistory,
    removeDraft,
    reset,
  } = useWritingStore();

  useWritingAnalyzer();
  const { save, lastSaved } = useAutoSave();

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const hasContent = content.trim().length > 0;
  const timeAgo = useMemo(() => formatSavedTime(lastSaved, now), [lastSaved, now]);

  const issueCount =
    (lastAnalysis?.spellingErrors.length ?? 0) + (lastAnalysis?.outOfLevelWords.length ?? 0);

  const handleInsertAssistant = useCallback(
    (text: string) => {
      setContent(content ? `${content}\n${text}` : text);
      setShowAssistant(false);
    },
    [content, setContent, setShowAssistant],
  );

  const handleApplySimplified = useCallback(
    (text: string) => {
      setContent(text);
      setShowSimplifier(false);
    },
    [setContent, setShowSimplifier],
  );

  const handleSelectHistory = useCallback(
    (record: HistoryRecord) => {
      setTitle(record.title || "");
      setContent(record.content);
      setShowHistory(false);
    },
    [setContent, setShowHistory, setTitle],
  );

  const handleSaveNow = useCallback(() => {
    save();
    setNow(Date.now());
    setSavedToast(true);
    window.setTimeout(() => setSavedToast(false), 2000);
  }, [save]);

  const handleClear = useCallback(() => {
    if (content && !window.confirm("确定清空当前作文吗？草稿会被保留。")) return;
    setTitle("");
    setContent("");
    reset();
    setNow(Date.now());
  }, [content, reset, setContent, setTitle]);

  return (
    <div className="min-h-screen pb-20">
      <Header title="作文助手" />

      <div className="mx-auto max-w-lg space-y-3 p-4">
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="作文标题（可选）"
          className="w-full rounded-xl border-2 bg-background px-4 py-2.5 text-base font-medium outline-none placeholder:text-muted-foreground/40 focus:border-transparent focus:ring-2 focus:ring-ring"
        />

        <div className="relative overflow-hidden rounded-xl border-2 bg-background transition-shadow focus-within:border-transparent focus-within:ring-2 focus-within:ring-ring">
          <WritingEditor
            value={content}
            onChange={setContent}
            analysis={lastAnalysis}
            placeholder="开始写作文，系统会实时检测拼写错误和超纲词。"
            autoFocus
          />
        </div>

        <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
          {timeAgo ? (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              自动保存于 {timeAgo}
            </span>
          ) : hasContent ? (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              正在输入...
            </span>
          ) : null}
          <span className="flex-1" />
          {hasContent && lastAnalysis && (
            <span className="tabular-nums">
              {lastAnalysis.words.length} 词 · CET4{" "}
              {(lastAnalysis.vocabularyCoverage * 100).toFixed(0)}%
            </span>
          )}
        </div>

        {savedToast && (
          <div className="mx-auto flex w-fit items-center justify-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700 animate-in slide-in-from-top-2 dark:bg-emerald-950/40 dark:text-emerald-300">
            <Save className="h-3 w-3" />
            已手动保存
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAssistant(!showAssistant)}
            className={
              showAssistant
                ? "bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400"
                : ""
            }
          >
            <Lightbulb className="mr-1.5 h-3.5 w-3.5" />
            表达助手
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowSimplifier(!showSimplifier)}
            disabled={!hasContent}
            className={
              showSimplifier
                ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400"
                : ""
            }
          >
            <Wand2 className="mr-1.5 h-3.5 w-3.5" />
            简化
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowScore(!showScore)}
            disabled={!hasContent}
            className={
              showScore ? "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400" : ""
            }
          >
            <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
            评分
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowHistory(!showHistory)}
            className={
              showHistory ? "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400" : ""
            }
          >
            <History className="mr-1.5 h-3.5 w-3.5" />
            历史
          </Button>

          <span className="flex-1" />

          <Button size="sm" variant="ghost" onClick={handleSaveNow}>
            <Save className="mr-1.5 h-3.5 w-3.5" />
            保存
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleClear}
            disabled={!hasContent}
            className="text-muted-foreground"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {showSuggestions && (
          <WritingSuggestions analysis={lastAnalysis} onClose={() => setShowSuggestions(false)} />
        )}

        {lastAnalysis && issueCount > 0 && !showSuggestions && (
          <button
            onClick={() => setShowSuggestions(true)}
            className="flex w-full items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-300"
          >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>发现 {issueCount} 个问题，点击查看详情</span>
          </button>
        )}

        {showAssistant && (
          <WritingAssistant
            onInsert={handleInsertAssistant}
            onClose={() => setShowAssistant(false)}
          />
        )}

        {showSimplifier && (
          <WritingSimplifier
            originalText={content}
            onApply={handleApplySimplified}
            onClose={() => setShowSimplifier(false)}
          />
        )}

        {showScore && <WritingScoreCard score={score} coverage={coverageReport} />}

        {showHistory && (
          <WritingHistory
            records={history}
            onSelect={handleSelectHistory}
            onDelete={(id) => removeDraft(id)}
            onClose={() => setShowHistory(false)}
          />
        )}

        {!hasContent && !showAssistant && !showHistory && (
          <div className="mt-6 space-y-4">
            <div className="py-6 text-center">
              <PenTool className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">开始写你的第一篇 CET-4 作文。</p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                系统会实时检测拼写错误、超纲词和词汇覆盖率。
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowAssistant(true)}
                className="rounded-xl border bg-card p-3 text-left transition-colors hover:bg-muted/30"
              >
                <Lightbulb className="mb-1.5 h-5 w-5 text-purple-500" />
                <p className="text-sm font-medium">表达助手</p>
                <p className="mt-0.5 text-xs text-muted-foreground">中文想法转 CET-4 表达</p>
              </button>

              <button
                onClick={() => setShowHistory(true)}
                className="rounded-xl border bg-card p-3 text-left transition-colors hover:bg-muted/30"
              >
                <History className="mb-1.5 h-5 w-5 text-blue-500" />
                <p className="text-sm font-medium">作文历史</p>
                <p className="mt-0.5 text-xs text-muted-foreground">查看过往作文</p>
              </button>
            </div>

            <div className="space-y-2 rounded-xl border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">写作提示</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>优先使用你已掌握的四级词汇。</p>
                <p>超纲词会被高亮，并给出替换建议。</p>
                <p>拼写错误会标记，便于进入薄弱点复习。</p>
                <p>内容会自动保存，避免草稿丢失。</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
