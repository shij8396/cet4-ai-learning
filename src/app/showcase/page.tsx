import { BookOpen, CheckCircle, Database, Server, Shield, Smartphone } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Project Showcase",
  description: "CET4 AI Learning architecture and product highlights",
};

const highlights = [
  {
    icon: Smartphone,
    title: "Mobile-first learning",
    description:
      "Word review, reading, writing, and weak-point workflows are optimized for daily study sessions.",
  },
  {
    icon: Server,
    title: "FastAPI backend",
    description:
      "Authentication, word progress, analytics, and support APIs live behind the backend v1 boundary.",
  },
  {
    icon: Database,
    title: "SQLAlchemy data layer",
    description: "The backend owns persistence and migrations through SQLAlchemy and Alembic.",
  },
  {
    icon: Shield,
    title: "Token-based auth",
    description: "The frontend stores backend access tokens and sends them with API requests.",
  },
];

const stack = {
  frontend: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS", "Zustand"],
  backend: ["FastAPI", "SQLAlchemy", "Alembic", "MySQL", "Redis"],
  quality: ["Vitest", "pytest", "Playwright", "ESLint", "CI"],
};

export default function ShowcasePage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="border-b px-4 py-16">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-4 inline-flex items-center rounded-full border bg-background px-4 py-1.5 text-sm">
            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
            Split frontend and backend architecture
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">CET4 AI Learning</h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            A focused English learning app moving forward on Next.js for the web experience and
            FastAPI for API, data, and authentication.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild>
              <Link href="/learn">
                <BookOpen className="mr-2 h-4 w-4" />
                Start learning
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Dashboard</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((item) => (
            <div key={item.title} className="rounded-lg border bg-card p-5">
              <item.icon className="mb-3 h-5 w-5 text-primary" />
              <h2 className="font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {Object.entries(stack).map(([group, items]) => (
            <div key={group} className="rounded-lg border bg-card p-5">
              <h2 className="mb-3 font-semibold capitalize">{group}</h2>
              <div className="flex flex-wrap gap-2">
                {items.map((item) => (
                  <span key={item} className="rounded-md bg-muted px-2.5 py-1 text-sm">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
