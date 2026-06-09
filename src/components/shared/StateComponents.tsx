"use client";

import {
  AlertCircle,
  CloudOff,
  Inbox,
  Loader2,
  SearchX,
  Sparkles,
  Wifi,
  WifiOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title = "暂无数据",
  description = "这里还没有内容",
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center min-h-[300px] ${className}`}
    >
      <div className="rounded-full bg-muted p-4 mb-4">
        {icon || <Inbox className="h-8 w-8 text-muted-foreground" />}
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-xs">{description}</p>
      {action && (
        <Button variant="outline" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function EmptySearch({
  searchQuery,
  onClear,
}: {
  searchQuery: string;
  onClear?: () => void;
}) {
  return (
    <EmptyState
      icon={<SearchX className="h-8 w-8 text-muted-foreground" />}
      title="未找到结果"
      description={`没有找到与 "${searchQuery}" 相关的内容`}
      action={onClear ? { label: "清除搜索", onClick: onClear } : undefined}
    />
  );
}

export function EmptyWords() {
  return (
    <EmptyState
      icon={<Inbox className="h-8 w-8 text-muted-foreground" />}
      title="还没有单词"
      description="开始学习后，你的单词会出现在这里"
    />
  );
}

export function EmptyReadings() {
  return (
    <EmptyState
      icon={<Inbox className="h-8 w-8 text-muted-foreground" />}
      title="还没有阅读记录"
      description="完成阅读理解后，记录会出现在这里"
    />
  );
}

export function EmptyFavorites() {
  return (
    <EmptyState
      icon={<Inbox className="h-8 w-8 text-muted-foreground" />}
      title="还没有收藏"
      description="收藏你喜欢的单词，方便复习"
    />
  );
}

interface NetworkErrorProps {
  onRetry?: () => void;
  className?: string;
}

export function NetworkError({ onRetry, className = "" }: NetworkErrorProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center min-h-[300px] ${className}`}
    >
      <div className="rounded-full bg-warning/10 p-4 mb-4">
        <CloudOff className="h-12 w-12 text-warning" />
      </div>
      <h3 className="text-lg font-semibold mb-1">网络连接失败</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        请检查您的网络连接后重试。您可以在离线模式下查看已下载的内容。
      </p>
      <div className="flex gap-3">
        {onRetry && (
          <Button onClick={onRetry}>
            <Wifi className="h-4 w-4 mr-2" />
            重新连接
          </Button>
        )}
      </div>
    </div>
  );
}

interface OfflineBannerProps {
  className?: string;
}

export function OfflineBanner({ className = "" }: OfflineBannerProps) {
  return (
    <div
      className={`flex items-center justify-center gap-2 bg-warning/10 text-warning-foreground px-4 py-2 text-sm ${className}`}
    >
      <WifiOff className="h-4 w-4" />
      <span>当前处于离线模式，部分功能不可用</span>
    </div>
  );
}

interface AIGeneratingProps {
  message?: string;
  className?: string;
}

export function AIGenerating({
  message = "AI 正在生成内容...",
  className = "",
}: AIGeneratingProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center min-h-[200px] ${className}`}
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-75" />
        <div className="relative rounded-full bg-primary/10 p-4">
          <Sparkles className="h-8 w-8 text-primary animate-pulse" />
        </div>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm font-medium">{message}</span>
      </div>
      <p className="text-xs text-muted-foreground">这可能需要几秒钟</p>
    </div>
  );
}

export function PageLoading({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center min-h-[60vh] ${className}`}>
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-sm text-muted-foreground">加载中...</p>
    </div>
  );
}

export function PageError({
  title = "加载失败",
  message = "请检查网络连接后重试",
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">{message}</p>
      {onRetry && <Button onClick={onRetry}>重试</Button>}
    </div>
  );
}
