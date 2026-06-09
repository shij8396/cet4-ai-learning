"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function Header({ title, showBack = false, onBack, rightAction }: HeaderProps) {
  const pathname = usePathname();

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  const backHref = pathname.split("/").slice(0, -1).join("/") || "/";

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <div className="flex items-center gap-2 min-w-0">
          {showBack && (
            <Link href={backHref} onClick={onBack ? handleBack : undefined}>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
          )}
          {title && <h1 className="text-lg font-bold truncate">{title}</h1>}
        </div>
        <div className="flex items-center gap-1">
          {rightAction}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
