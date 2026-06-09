import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { dirname, join, resolve } from "path";

const PROJECT_ROOT = (() => {
  let dir = resolve(__dirname);
  for (let i = 0; i < 10; i++) {
    if (existsSync(join(dir, "package.json"))) {
      return dir.replace(/\\/g, "/");
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return dir.replace(/\\/g, "/");
})();

const PACKAGE_JSON = JSON.parse(readFileSync(`${PROJECT_ROOT}/package.json`, "utf-8"));

function fromSrc(path: string): string {
  return `${PROJECT_ROOT}/src/${path}`;
}

function fromPrisma(path: string): string {
  return `${PROJECT_ROOT}/prisma/${path}`;
}

export const config = {
  projectRoot: PROJECT_ROOT,
  packageJson: PACKAGE_JSON,

  paths: {
    envLocal: `${PROJECT_ROOT}/.env.local`,
    envExample: `${PROJECT_ROOT}/.env.example`,
    envDevelopment: `${PROJECT_ROOT}/.env.development`,

    auth: fromSrc("lib/auth.ts"),
    middleware: fromSrc("middleware.ts"),
    prismaClient: fromSrc("lib/prisma.ts"),

    nextAuthRoute: fromSrc("app/api/auth/[...nextauth]/route.ts"),
    appDir: fromSrc("app"),
    apiDir: fromSrc("app/api"),

    schemaPrisma: fromPrisma("schema.prisma"),
    generatedPrisma: fromSrc("generated/prisma"),

    manifestJson: `${PROJECT_ROOT}/public/manifest.json`,
    iconsDir: `${PROJECT_ROOT}/public/icons`,

    vocabValidator: fromSrc("lib/vocabulary-validator"),
    aiServices: fromSrc("services/ai"),

    nextConfig: `${PROJECT_ROOT}/next.config.ts`,
    tsconfig: `${PROJECT_ROOT}/tsconfig.json`,
    eslintConfig: `${PROJECT_ROOT}/eslint.config.mjs`,

    reportOutput: `${PROJECT_ROOT}/doctor-report.md`,
  },

  requiredEnvVars: [
    { key: "DATABASE_URL", pattern: /^postgresql:\/\/.+/ },
    { key: "AUTH_SECRET", pattern: /^.{10,}$/ },
    { key: "AUTH_URL", pattern: /^https?:\/\/.+/ },
    { key: "OPENAI_API_KEY", pattern: /^sk-.{20,}$/ },
  ],

  optionalEnvVars: [
    "AI_PROVIDER",
    "AI_RATE_LIMIT_PER_HOUR",
    "AI_RATE_LIMIT_PER_DAY",
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_APP_NAME",
    "ADMIN_USER_IDS",
  ],
};

export function execCommand(cmd: string, cwd?: string): { output: string; error: string } {
  try {
    const output = execSync(cmd, {
      cwd: cwd || config.projectRoot,
      encoding: "utf-8",
      timeout: 30000,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { output, error: "" };
  } catch (e: unknown) {
    const err = e as { stdout?: string; stderr?: string; message?: string };
    return {
      output: (err.stdout as string) || "",
      error: (err.stderr as string) || err.message || "",
    };
  }
}

export async function execAsync(
  cmd: string,
  cwd?: string,
): Promise<{ output: string; error: string }> {
  return execCommand(cmd, cwd);
}
