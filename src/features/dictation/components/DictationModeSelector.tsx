"use client";

import { FileText, RotateCcw, Sparkles, Type, Volume2 } from "lucide-react";
import { memo } from "react";

import { Card, CardContent } from "@/components/ui/card";

import type { DictationMode } from "../services/dictationEngine";

interface ModeSelectorProps {
  selectedMode: DictationMode;
  onSelect: (mode: DictationMode) => void;
  wordCount: number;
}

interface ModeOption {
  mode: DictationMode;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const MODE_OPTIONS: ModeOption[] = [
  {
    mode: "cn_to_en",
    icon: <Type className="h-5 w-5" />,
    title: "中文到英文",
    description: "看中文释义，写出英文单词",
  },
  {
    mode: "listen_to_en",
    icon: <Volume2 className="h-5 w-5" />,
    title: "听音拼写",
    description: "听发音，写出英文单词",
  },
  {
    mode: "fill_in_blank",
    icon: <FileText className="h-5 w-5" />,
    title: "例句填空",
    description: "根据例句上下文，填入目标单词",
  },
  {
    mode: "review",
    icon: <RotateCcw className="h-5 w-5" />,
    title: "错词强化",
    description: "从当前词库中抽取薄弱词练习",
  },
];

export const DictationModeSelector = memo(function DictationModeSelector({
  selectedMode,
  onSelect,
  wordCount,
}: ModeSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="mb-6 text-center">
        <div className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold">选择默写模式</h2>
        <p className="mt-1 text-sm text-muted-foreground">本轮 {wordCount} 个单词</p>
      </div>

      <div className="grid gap-3">
        {MODE_OPTIONS.map((option) => (
          <Card
            key={option.mode}
            className={`cursor-pointer transition-all active:scale-[0.98] ${
              selectedMode === option.mode
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "hover:border-muted-foreground/30"
            }`}
            onClick={() => onSelect(option.mode)}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  selectedMode === option.mode
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {option.icon}
              </div>
              <div className="text-left">
                <h3 className="text-sm font-semibold">{option.title}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{option.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
});
