"use client";

import { motion } from "framer-motion";
import { BookOpen, FileText, GraduationCap, Home, Pencil, PenTool, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "首页", icon: Home },
  { href: "/learn", label: "学习", icon: GraduationCap },
  { href: "/words", label: "单词", icon: BookOpen },
  { href: "/reading", label: "阅读", icon: FileText },
  { href: "/dictation", label: "默写", icon: Pencil },
  { href: "/writing", label: "作文", icon: PenTool },
  { href: "/profile", label: "更多", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    navItems.forEach((item) => router.prefetch(item.href));
  }, [router]);

  const isMoreActive = ["/profile", "/analytics", "/achievements", "/settings"].some(
    (p) => pathname === p || pathname.startsWith(p),
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-lg safe-area-bottom">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2 pb-safe">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href)) ||
            (item.href === "/profile" && isMoreActive);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className={cn(
                "relative flex min-w-[48px] flex-col items-center justify-center gap-0.5 py-1 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <motion.div
                className="flex flex-col items-center justify-center gap-0.5"
                initial={false}
                whileTap={{ scale: 0.9 }}
              >
                <motion.div
                  initial={false}
                  animate={isActive ? { scale: [0.85, 1] } : { scale: 1 }}
                  transition={
                    isActive ? { type: "spring", stiffness: 400, damping: 17 } : { duration: 0 }
                  }
                >
                  <Icon className="h-5 w-5" />
                </motion.div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </motion.div>
              {isActive && (
                <motion.div
                  className="absolute -bottom-0.5 h-[3px] w-[3px] rounded-full bg-primary"
                  layoutId="nav-indicator"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
