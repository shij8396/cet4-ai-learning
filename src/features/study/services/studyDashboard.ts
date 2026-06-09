export type DailyTaskType = "words" | "reading" | "dictation" | "writing";
export type DailyTaskStatus = "done" | "active" | "pending";

export interface TodayDashboardInput {
  wordsLearned: number;
  wordsReviewed: number;
  articlesRead: number;
  dictations: number;
  writingCount: number;
  studyMinutes: number;
  weakPointCount: number;
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
}

export interface ReadingProgressWeakness {
  id: string;
  articleTitle: string;
  unknownWords: string[];
  clickedWords: string[];
}

export interface DictationRecordWeakness {
  id: string;
  word: string;
  correctAnswer: string;
  userAnswer: string | null;
  isCorrect: boolean;
}

export interface WritingRecordWeakness {
  id: string;
  title: string | null;
  outOfLevelWords: string[];
  spellingErrors: string[];
}

export interface WeaknessInput {
  wordProgress: WordProgressWeakness[];
  readingProgress: ReadingProgressWeakness[];
  dictationRecords: DictationRecordWeakness[];
  writingRecords: WritingRecordWeakness[];
}

export interface WeaknessItem {
  id: string;
  type: "word" | "reading" | "dictation" | "writing";
  title: string;
  description: string;
  sources: string[];
  actionHref: string;
  priority: number;
  refId: string;
}

const TASKS: Array<Omit<DailyTask, "current" | "progress" | "status">> = [
  {
    type: "words",
    title: "单词学习",
    description: "新学与复习合计 100 个",
    href: "/learn",
    target: 100,
  },
  {
    type: "reading",
    title: "阅读训练",
    description: "完成 1 篇分级阅读",
    href: "/reading",
    target: 1,
  },
  {
    type: "dictation",
    title: "默写练习",
    description: "完成 1 组真实词库默写",
    href: "/dictation",
    target: 1,
  },
  {
    type: "writing",
    title: "作文练习",
    description: "完成 1 篇四级作文",
    href: "/writing",
    target: 1,
  },
];

function clampProgress(current: number, target: number) {
  if (target <= 0) return 100;
  return Math.min(Math.round((current / target) * 100), 100);
}

function taskStatus(progress: number): DailyTaskStatus {
  if (progress >= 100) return "done";
  if (progress > 0) return "active";
  return "pending";
}

export function buildTodayDashboard(input: TodayDashboardInput): TodayDashboard {
  const taskCurrent: Record<DailyTaskType, number> = {
    words: input.wordsLearned + input.wordsReviewed,
    reading: input.articlesRead,
    dictation: input.dictations,
    writing: input.writingCount,
  };

  const tasks = TASKS.map((task) => {
    const current = taskCurrent[task.type];
    const progress = clampProgress(current, task.target);
    return {
      ...task,
      current,
      progress,
      status: taskStatus(progress),
    };
  });

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
  const byTitle = new Map<string, WeaknessItem>();

  const add = (
    title: string,
    source: string,
    item: Omit<WeaknessItem, "title" | "sources" | "priority"> & { priority?: number },
  ) => {
    const normalized = title.trim().toLowerCase();
    if (!normalized) return;

    const existing = byTitle.get(normalized);
    if (existing) {
      if (!existing.sources.includes(source)) {
        existing.sources.push(source);
      }
      existing.priority += item.priority ?? 1;
      return;
    }

    byTitle.set(normalized, {
      ...item,
      title: normalized,
      sources: [source],
      priority: item.priority ?? 1,
    });
  };

  input.wordProgress.forEach((record) => {
    add(record.word, "单词错题", {
      id: `word:${record.id}`,
      refId: record.wordId,
      type: "word",
      description: `${record.meaning} · 错 ${record.wrongCount} 次 · 掌握度 ${record.masteryLevel}/5`,
      actionHref: `/words/${record.wordId}`,
      priority: 3 + record.wrongCount,
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
      });
    });
  });

  return [...byTitle.values()];
}
