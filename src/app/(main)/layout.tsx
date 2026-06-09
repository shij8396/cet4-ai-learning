"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { Suspense, useMemo } from "react";

import { AuthProvider } from "@/components/layout/AuthProvider";
import { BottomNav } from "@/components/layout/BottomNav";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import {
  SkeletonPage,
  SkeletonWordCard,
  SkeletonArticleCard,
  SkeletonStats,
  SkeletonProfile,
  SkeletonList,
} from "@/components/shared/SkeletonLoading";

function getSkeletonFallback(pathname: string) {
  if (pathname.startsWith("/words")) return <SkeletonList count={4} item={SkeletonWordCard} />;
  if (pathname.startsWith("/reading")) return <SkeletonList count={3} item={SkeletonArticleCard} />;
  if (pathname.startsWith("/learn")) return <SkeletonPage />;
  if (pathname.startsWith("/profile")) return <SkeletonProfile />;
  if (pathname.startsWith("/analytics") || pathname.startsWith("/achievements"))
    return <SkeletonStats />;
  return <SkeletonPage />;
}

function PageContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const skeletonFallback = useMemo(() => getSkeletonFallback(pathname), [pathname]);

  return (
    <motion.main
      initial={false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.08 }}
      className="flex-1 bg-background pb-20"
    >
      <Suspense fallback={skeletonFallback}>{children}</Suspense>
    </motion.main>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className="flex flex-col min-h-screen overflow-hidden bg-background">
          <PageContent>{children}</PageContent>
          <BottomNav />
        </div>
      </AuthProvider>
    </ErrorBoundary>
  );
}
