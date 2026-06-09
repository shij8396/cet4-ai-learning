import {
  BookOpen,
  Brain,
  CheckCircle,
  Globe,
  Layout,
  PenTool,
  Shield,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "项目展示",
  description: "AI 英语四级学习系统 - 项目功能与技术亮点展示",
};

const highlights = [
  {
    icon: Sparkles,
    title: "Vocabulary Validator",
    description:
      "自研词汇约束验证系统，确保所有 AI 生成内容严格限制在 CET4 范围内，包含拼写检查、词形还原、级别检测、可读性分析。",
    badge: "核心创新",
  },
  {
    icon: Brain,
    title: "AI 学习引擎",
    description:
      "多 Provider 适配的 AI 引擎，支持智能内容生成、个性化学习推荐、自适应难度调整，配备完整的内容审核 Pipeline。",
    badge: "AI 集成",
  },
  {
    icon: Layout,
    title: "Mobile-First 架构",
    description:
      "从设计到实现的移动端优先架构，响应式布局 + 底部导航 + PWA 离线支持，确保手机端原生 App 般的体验。",
    badge: "架构设计",
  },
  {
    icon: TrendingUp,
    title: "动态难度系统",
    description:
      "三层难度控制模型：基于词汇频率的内容难度、基于正确率的练习难度、基于用户水平的 AI 生成难度。",
    badge: "算法",
  },
  {
    icon: PenTool,
    title: "AI 作文批改",
    description: "多层次作文评估：语法错误检测、表达优化建议、CET4 词汇使用分析、写作风格评分。",
    badge: "AI 应用",
  },
  {
    icon: BookOpen,
    title: "智能默写系统",
    description: "词形还原匹配引擎，支持动词时态、名词复数、形容词比较级的智能识别和模糊评分。",
    badge: "NLP",
  },
  {
    icon: Shield,
    title: "安全防护",
    description: "完整的 XSS/CSRF 防护、API 速率限制、输入净化、CSP 安全头、角色权限控制。",
    badge: "安全",
  },
  {
    icon: Zap,
    title: "性能优化",
    description:
      "React Memo + Suspense + Lazy Loading + Prisma 缓存 + Bundle 优化，确保移动端流畅运行。",
    badge: "性能",
  },
];

const techStack = {
  frontend: [
    "Next.js 16",
    "React 19",
    "TypeScript 5",
    "Tailwind CSS 4",
    "Framer Motion",
    "Zustand 5",
    "Recharts",
    "React Hook Form + Zod",
  ],
  backend: ["Prisma 7", "PostgreSQL", "NextAuth 5", "bcryptjs", "RESTful API"],
  ai: [
    "OpenAI GPT-4o",
    "Multi-Provider Adapter",
    "Prompt Template Engine",
    "AI Content Validator",
    "AI Cache Layer",
  ],
  engineering: ["ESLint 9", "Prettier", "Husky", "commitlint", "Vitest", "Docker", "PWA"],
  security: [
    "CSP Headers",
    "XSS Protection",
    "CSRF Protection",
    "Rate Limiting",
    "RBAC",
    "Input Sanitization",
  ],
};

export default function ShowcasePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background pb-12">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-8 text-center">
          <div className="mb-4 inline-flex items-center rounded-full border bg-background px-4 py-1.5 text-sm">
            <Sparkles className="mr-2 h-4 w-4 text-primary" />
            AI-Powered · Open Source · Production Ready
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            AI 英语四级学习系统
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            基于 AI 词汇约束与动态难度控制的 CET4 智能学习平台。 从 AI
            内容生成到学习评估的完整闭环系统。
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/learn">
                <Globe className="mr-2 h-5 w-5" />
                开始学习
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="https://github.com" target="_blank">
                查看源码
              </Link>
            </Button>
          </div>
          <div className="mt-8 flex justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-green-500" />
              TypeScript
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-green-500" />
              PWA Ready
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Docker Support
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-green-500" />
              MIT Licensed
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">项目亮点</h2>
          <p className="mt-2 text-muted-foreground">8 大核心技术亮点，打造产品级 AI 学习平台</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="group relative rounded-xl border bg-card p-5 transition-shadow hover:shadow-lg"
            >
              <span className="mb-3 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {item.badge}
              </span>
              <div className="mb-3 rounded-lg bg-muted p-2.5 w-fit">
                <item.icon className="h-5 w-5 text-foreground" />
              </div>
              <h3 className="mb-1.5 font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-16 border-t">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">技术栈总览</h2>
          <p className="mt-2 text-muted-foreground">全栈 TypeScript，现代化技术选型</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(techStack).map(([category, techs]) => (
            <div key={category} className="rounded-xl border bg-card p-5">
              <h3 className="mb-3 font-semibold capitalize">{category}</h3>
              <div className="flex flex-wrap gap-2">
                {techs.map((tech) => (
                  <span key={tech} className="rounded-md bg-muted px-2.5 py-1 text-sm">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-16 border-t text-center">
        <h2 className="text-2xl font-bold sm:text-3xl mb-4">面试表达要点</h2>
        <div className="mx-auto max-w-3xl space-y-6 text-left">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold mb-2">Q: 请简单介绍这个项目</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              我开发了一个基于 AI 的 CET4 英语学习平台。核心亮点是自研的 Vocabulary Validator
              系统——它能确保所有 AI 生成内容严格限制在 CET4 词汇范围内。技术上采用 Next.js +
              TypeScript + Prisma 全栈架构，支持 PWA 离线学习，实现了完整的 AI 内容生成 → 词汇约束 →
              学习评估 → 个性化推荐的闭环。
            </p>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold mb-2">Q: AI 生成内容如何控制难度？</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              通过三层控制：Vocabulary Validator
              确保词汇合规，动态难度引擎根据用户表现调整内容复杂度，AI Prompt
              模板精确控制输出格式和难度。
            </p>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold mb-2">Q: 如何保证 AI 生成质量？</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              实现了完整的 AI 内容审核 Pipeline：内容验证 → 拼写检查 → 级别检测 →
              可读性评分，失败自动重试和降级处理。
            </p>
          </div>
        </div>
      </div>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>AI CET4 Learning · Built with TypeScript · Mobile-First · Open Source</p>
      </footer>
    </div>
  );
}
