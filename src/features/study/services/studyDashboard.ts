export type DailyTaskType = "words" | "reading" | "dictation" | "writing";
export type DailyTaskStatus = "done" | "active" | "pending";
export type DailyTaskSource = "system" | "review" | "weakness" | "progress";

export interface TodayDashboardInput {
  wordsLearned: number;
  wordsReviewed: number;
  articlesRead: number;
  dictations: number;
  writingCount: number;
  studyMinutes: number;
  weakPointCount: number;
  dueWordCount?: number;
  unreadArticleCount?: number;
  unresolvedWeaknessCount?: number;
  lastWritingAt?: Date | string | null;
}

export interface DailyTask {
  type: DailyTaskType;
  title: string;
  description: string;
  href: string;
  target: number;
  current: number;
  progress: number;
  status: DailyTaskStatus;
  priority: number;
  dueAt: string;
  source: DailyTaskSource;
}

export interface TodayDashboard {
  summary: TodayDashboardInput & {
    completedTasks: number;
    totalTasks: number;
  };
  tasks: DailyTask[];
}

export interface WordProgressWeakness {
  id: string;
  wordId: string;
  word: string;
  meaning: string;
  wrongCount: number;
  masteryLevel: number;
  updatedAt?: Date | string | null;
}

export interface ReadingProgressWeakness {
  id: string;
  articleTitle: string;
  unknownWords: string[];
  clickedWords: string[];
  updatedAt?: Date | string | null;
}

export interface DictationRecordWeakness {
  id: string;
  word: string;
  correctAnswer: string;
  userAnswer: string | null;
  isCorrect: boolean;
  createdAt?: Date | string | null;
}

export interface WritingRecordWeakness {
  id: string;
  title: string | null;
  outOfLevelWords: string[];
  spellingErrors: string[];
  updatedAt?: Date | string | null;
}

export interface WeaknessInput {
  wordProgress: WordProgressWeakness[];
  readingProgress: ReadingProgressWeakness[];
  dictationRecords: DictationRecordWeakness[];
  writingRecords: WritingRecordWeakness[];
  resolvedKeys?: string[];
}

export interface WeaknessItem {
  id: string;
  type: "word" | "reading" | "dictation" | "writing";
  title: string;
  description: string;
  sources: string[];
  actionHref: string;
  priority: number;
  severity: "low" | "medium" | "high";
  status: "open" | "resolved";
  lastSeenAt: string | null;
  refId: string;
}

const TASK_TEMPLATES: Array<
  Omit<DailyTask, "current" | "progress" | "status" | "priority" | "dueAt" | "source">
> = [
  {
    type: "words",
    title: "单词复习",
    description: "优先处理到期复习词和错词",
    href: "/learn",
    target: 100,
  },
  {
    type: "reading",
    title: "阅读训练",
    description: "完成 1 篇分级阅读并复盘生词",
    href: "/reading",
    target: 1,
  },
  {
    type: "dictation",
    title: "默写练习",
    description: "从错词和未掌握词中完成 1 组默写",
    href: "/dictation",
    target: 1,
  },
  {
    type: "writing",
    title: "作文练习",
    description: "完成 1 篇四级作文并复盘问题词",
    href: "/writing",
    target: 1,
  },
];

function todayDueAt(hour: number) {
  const due = new Date();
  due.setHours(hour, 0, 0, 0);
  return due.toISOString();
}

function clampProgress(current: number, target: number) {
  if (target <= 0) return 100;
  return Math.min(Math.round((current / target) * 100), 100);
}

function taskStatus(progress: number): DailyTaskStatus {
  if (progress >= 100) return "done";
  if (progress > 0) return "active";
  return "pending";
}

function severityFromPriority(priority: number): WeaknessItem["severity"] {
  if (priority >= 6) return "high";
  if (priority >= 3) return "medium";
  return "low";
}

function toIso(value?: Date | string | null) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export function buildTodayDashboard(input: TodayDashboardInput): TodayDashboard {
  const taskCurrent: Record<DailyTaskType, number> = {
    words: input.wordsLearned + input.wordsReviewed,
    reading: input.articlesRead,
    dictation: input.dictations,
    writing: input.writingCount,
  };

  const priorityByType: Record<DailyTaskType, number> = {
    words: Math.min(10, 3 + Math.ceil((input.dueWordCount ?? 0) / 20)),
    reading: (input.unreadArticleCount ?? 0) > 0 ? 5 : 2,
    dictation: (input.unresolvedWeaknessCount ?? input.weakPointCount) > 0 ? 6 : 3,
    writing: input.writingCount > 0 ? 2 : 4,
  };

  const sourceByType: Record<DailyTaskType, DailyTaskSource> = {
    words: (input.dueWordCount ?? 0) > 0 ? "review" : "system",
    reading: (input.unreadArticleCount ?? 0) > 0 ? "progress" : "system",
    dictation: (input.unresolvedWeaknessCount ?? input.weakPointCount) > 0 ? "weakness" : "system",
    writing: input.lastWritingAt ? "progress" : "system",
  };

  const dueHourByType: Record<DailyTaskType, number> = {
    words: 9,
    reading: 12,
    dictation: 18,
    writing: 21,
  };

  const tasks = TASK_TEMPLATES.map((task) => {
    const current = taskCurrent[task.type];
    const progress = clampProgress(current, task.target);

    return {
      ...task,
      current,
      progress,
      status: taskStatus(progress),
      priority: priorityByType[task.type],
      dueAt: todayDueAt(dueHourByType[task.type]),
      source: sourceByType[task.type],
    };
  }).sort((a, b) => b.priority - a.priority);

  return {
    summary: {
      ...input,
      completedTasks: tasks.filter((task) => task.status === "done").length,
      totalTasks: tasks.length,
    },
    tasks,
  };
}

export function buildWeaknessList(input: WeaknessInput): WeaknessItem[] {
  const resolved = new Set(input.resolvedKeys ?? []);
  const byTitle = new Map<string, WeaknessItem>();

  const add = (
    title: string,
    source: string,
    item: Omit<WeaknessItem, "title" | "sources" | "priority" | "severity" | "status"> & {
      priority?: number;
    },
  ) => {
    const normalized = title.trim().toLowerCase();
    if (!normalized) return;

    const existing = byTitle.get(normalized);
    if (existing) {
      if (!existing.sources.includes(source)) {
        existing.sources.push(source);
      }
      existing.priority += item.priority ?? 1;
      existing.severity = severityFromPriority(existing.priority);
      if (item.lastSeenAt && (!existing.lastSeenAt || item.lastSeenAt > existing.lastSeenAt)) {
        existing.lastSeenAt = item.lastSeenAt;
      }
      return;
    }

    const priority = item.priority ?? 1;
    const status =
      resolved.has(item.id) || resolved.has(`${item.type}:${item.refId}`) ? "resolved" : "open";

    byTitle.set(normalized, {
      ...item,
      title: normalized,
      sources: [source],
      priority,
      severity: severityFromPriority(priority),
      status,
    });
  };

  input.wordProgress.forEach((record) => {
    add(record.word, "单词错题", {
      id: `word:${record.wordId}`,
      refId: record.wordId,
      type: "word",
      description: `${record.meaning} · 错 ${record.wrongCount} 次 · 掌握度 ${record.masteryLevel}/5`,
      actionHref: `/words/${record.wordId}`,
      priority: 3 + record.wrongCount,
      lastSeenAt: toIso(record.updatedAt),
    });
  });

  input.readingProgress.forEach((record) => {
    record.unknownWords.forEach((word) => {
      add(word, "阅读生词", {
        id: `reading:${record.id}:${word}`,
        refId: record.id,
        type: "reading",
        description: `来自阅读《${record.articleTitle}》`,
        actionHref: "/reading",
        priority: 2,
        lastSeenAt: toIso(record.updatedAt),
      });
    });

    record.clickedWords.forEach((word) => {
      add(word, "阅读点查", {
        id: `reading-click:${record.id}:${word}`,
        refId: record.id,
        type: "reading",
        description: "阅读中查询过，建议复习",
        actionHref: "/reading",
        priority: 1,
        lastSeenAt: toIso(record.updatedAt),
      });
    });
  });

  input.dictationRecords
    .filter((record) => !record.isCorrect)
    .forEach((record) => {
      add(record.correctAnswer || record.word, "默写错误", {
        id: `dictation:${record.id}`,
        refId: record.id,
        type: "dictation",
        description: record.userAnswer ? `写成了 ${record.userAnswer}` : "默写时未能正确作答",
        actionHref: "/dictation",
        priority: 2,
        lastSeenAt: toIso(record.createdAt),
      });
    });

  input.writingRecords.forEach((record) => {
    record.outOfLevelWords.forEach((word) => {
      add(word, "作文超纲", {
        id: `writing:${record.id}:${word}`,
        refId: record.id,
        type: "writing",
        description: record.title ? `来自作文《${record.title}》` : "作文中出现的超纲词",
        actionHref: "/writing",
        priority: 2,
        lastSeenAt: toIso(record.updatedAt),
      });
    });

    record.spellingErrors.forEach((word) => {
      add(word, "作文拼写", {
        id: `writing-spelling:${record.id}:${word}`,
        refId: record.id,
        type: "writing",
        description: record.title ? `来自作文《${record.title}》` : "作文拼写错误",
        actionHref: "/writing",
        priority: 2,
        lastSeenAt: toIso(record.updatedAt),
      });
    });
  });

  return [...byTitle.values()]
    .filter((item) => item.status === "open")
    .sort((a, b) => b.priority - a.priority);
}
