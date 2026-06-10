import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

import { describe, expect, it } from "vitest";

const ROOTS = ["README.md", "docs", "src", "tests", "prisma", "scripts"];
const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".md",
  ".json",
  ".prisma",
  ".yml",
  ".yaml",
]);
const IGNORED_PARTS = new Set([
  "generated",
  "node_modules",
  ".next",
  "test-results",
  "playwright-report",
]);
const MOJIBAKE_PATTERNS = [
  "\u9357",
  "\u95c3",
  "\u7487",
  "\u93c8",
  "\u6fb6",
  "\u9286",
  "\u951b",
  "\u9427",
  "\u95ad",
  "\u7025",
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
    if (child.split(/[\\/]/).some((part) => IGNORED_PARTS.has(part))) {
      return [];
    }
    return listTextFiles(child);
  });
}

describe("source text encoding", () => {
  it("does not contain common Chinese mojibake fragments", () => {
    const offenders = ROOTS.flatMap(listTextFiles).flatMap((file) => {
      const text = readFileSync(file, "utf8");
      return MOJIBAKE_PATTERNS.filter((pattern) => text.includes(pattern)).map(
        (pattern) => `${file} contains U+${pattern.charCodeAt(0).toString(16).toUpperCase()}`,
      );
    });

    expect(offenders).toEqual([]);
  });
});
