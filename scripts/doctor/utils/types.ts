export type IssueSeverity = "error" | "warning" | "info";

export type CheckCategory =
  | "env"
  | "nextauth"
  | "prisma"
  | "app-router"
  | "typescript"
  | "eslint"
  | "pwa"
  | "routes"
  | "vocab"
  | "ai"
  | "performance"
  | "dependencies";

export interface DoctorIssue {
  category: CheckCategory;
  severity: IssueSeverity;
  message: string;
  file?: string;
  line?: number;
  fix?: string;
  autoFixable: boolean;
}

export interface CheckResult {
  category: CheckCategory;
  name: string;
  passed: boolean;
  issues: DoctorIssue[];
  duration: number;
}

export interface DoctorReport {
  timestamp: string;
  totalChecks: number;
  passedChecks: number;
  totalIssues: number;
  errors: number;
  warnings: number;
  infos: number;
  score: number;
  results: CheckResult[];
}

export interface CliOptions {
  deep: boolean;
  fix: boolean;
  silent: boolean;
}
