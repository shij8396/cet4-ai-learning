import { cn } from "@/lib/utils";

function SkeletonBase({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBase key={i} className={cn("h-4", i === lines - 1 ? "w-3/4" : "w-full")} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-4 space-y-3", className)}>
      <SkeletonBase className="h-4 w-3/4" />
      <SkeletonBase className="h-4 w-full" />
      <SkeletonBase className="h-4 w-1/2" />
    </div>
  );
}

export function SkeletonWordCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-4 space-y-3", className)}>
      <div className="flex items-center justify-between">
        <SkeletonBase className="h-6 w-24" />
        <SkeletonBase className="h-4 w-16" />
      </div>
      <SkeletonBase className="h-3 w-32" />
      <div className="space-y-2 pt-2">
        <SkeletonBase className="h-3 w-full" />
        <SkeletonBase className="h-3 w-5/6" />
      </div>
    </div>
  );
}

export function SkeletonArticleCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-4 space-y-4", className)}>
      <SkeletonBase className="h-5 w-2/3" />
      <div className="flex gap-2">
        <SkeletonBase className="h-5 w-16 rounded-full" />
        <SkeletonBase className="h-5 w-20 rounded-full" />
      </div>
      <div className="space-y-2">
        <SkeletonBase className="h-3 w-full" />
        <SkeletonBase className="h-3 w-full" />
        <SkeletonBase className="h-3 w-2/3" />
      </div>
      <div className="flex justify-between">
        <SkeletonBase className="h-3 w-24" />
        <SkeletonBase className="h-3 w-16" />
      </div>
    </div>
  );
}

export function SkeletonList({
  count = 3,
  item: Item = SkeletonCard,
}: {
  count?: number;
  item?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Item key={i} />
      ))}
    </div>
  );
}

export function SkeletonStats({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-4 space-y-2">
          <SkeletonBase className="h-3 w-16" />
          <SkeletonBase className="h-8 w-12" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonPage({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 p-4", className)}>
      <SkeletonBase className="h-8 w-48" />
      <SkeletonBase className="h-5 w-64" />
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonAIResponse({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-4 space-y-3", className)}>
      <div className="flex items-center gap-2">
        <SkeletonBase className="h-8 w-8 rounded-full" />
        <SkeletonBase className="h-4 w-20" />
      </div>
      <div className="space-y-2 pl-10">
        <SkeletonBase className="h-3 w-full" />
        <SkeletonBase className="h-3 w-5/6" />
        <SkeletonBase className="h-3 w-4/6" />
      </div>
    </div>
  );
}

export function SkeletonProfile({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center space-y-4 p-6", className)}>
      <SkeletonBase className="h-20 w-20 rounded-full" />
      <SkeletonBase className="h-5 w-32" />
      <SkeletonBase className="h-4 w-48" />
      <div className="grid grid-cols-3 gap-4 w-full pt-4">
        <SkeletonBase className="h-16 rounded-lg" />
        <SkeletonBase className="h-16 rounded-lg" />
        <SkeletonBase className="h-16 rounded-lg" />
      </div>
    </div>
  );
}
