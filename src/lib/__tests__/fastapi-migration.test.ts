import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

import { describe, expect, it } from "vitest";

const ROOTS = [
  ".github",
  ".vscode",
  "backend",
  "docs",
  "public",
  "scripts",
  "src",
  "tests",
  "Dockerfile",
  "README.md",
  "docker-compose.yml",
  "next.config.ts",
  "package.json",
  "vercel.json",
];

const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".md",
  ".json",
  ".html",
  ".yml",
  ".yaml",
  ".py",
  ".tsx",
]);

const IGNORED_PARTS = new Set([
  ".git",
  ".next",
  "node_modules",
  "playwright-report",
  "test-results",
  "__pycache__",
]);
const IGNORED_FILES = new Set(["fastapi-migration.test.ts"]);
const IGNORED_FILE_PATTERNS = [/^sw\.js$/, /^workbox-.*\.js$/, /^fallback-.*\.js$/];

const FORBIDDEN_PATTERNS = [
  /\bPrisma\b/i,
  /\bNextAuth\b/i,
  /@prisma\//,
  /@auth\/prisma-adapter/,
  /src\/generated\/prisma/,
  /@\/generated\/prisma/,
  /@\/lib\/prisma/,
  /@\/lib\/auth(?!-token)/,
  /from\s+["']next-auth/,
  /\/api\/(?!v1(?:\/|["'`])|health|ready)/,
];

function extensionOf(path: string) {
  const index = path.lastIndexOf(".");
  return index >= 0 ? path.slice(index) : "";
}

function listTextFiles(path: string): string[] {
  if (!existsSync(path)) return [];

  const stats = statSync(path);
  if (stats.isFile()) {
    return TEXT_EXTENSIONS.has(extensionOf(path)) ? [path] : [];
  }

  return readdirSync(path).flatMap((entry) => {
    const child = join(path, entry);
    if (IGNORED_FILES.has(entry) || IGNORED_FILE_PATTERNS.some((pattern) => pattern.test(entry))) {
      return [];
    }
    if (child.split(/[\\/]/).some((part) => IGNORED_PARTS.has(part))) {
      return [];
    }
    return listTextFiles(child);
  });
}

describe("FastAPI migration boundary", () => {
  it("does not keep a parallel Django application", () => {
    expect(existsSync("django_app")).toBe(false);
  });

  it("does not keep Prisma, NextAuth, or legacy Next API references in app-facing code", () => {
    const offenders = ROOTS.flatMap(listTextFiles).flatMap((file) => {
      const text = readFileSync(file, "utf8");
      return FORBIDDEN_PATTERNS.filter((pattern) => pattern.test(text)).map(
        (pattern) => `${file} matches ${pattern}`,
      );
    });

    expect(offenders).toEqual([]);
  });
});
