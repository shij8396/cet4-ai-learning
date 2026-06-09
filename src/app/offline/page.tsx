"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="text-center space-y-4 max-w-sm">
        <div className="text-6xl">📡</div>
        <h1 className="text-xl font-bold">离线模式</h1>
        <p className="text-sm text-muted-foreground">
          你当前没有网络连接。部分功能可能受限，但你仍然可以继续学习。
        </p>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>✅ 查看已缓存的单词</p>
          <p>✅ 复习之前看过的文章</p>
          <p>✅ 默写练习（离线模式）</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium"
        >
          重新连接
        </button>
      </div>
    </div>
  );
}
