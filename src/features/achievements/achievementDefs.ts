export interface AchievementDef {
  key: string;
  name: string;
  description: string;
  icon: string;
  category: "streak" | "vocabulary" | "reading" | "writing" | "dictation" | "general";
  requirement: number;
  xpReward: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    key: "streak_3",
    name: "初出茅庐",
    description: "连续学习3天",
    icon: "🔥",
    category: "streak",
    requirement: 3,
    xpReward: 30,
  },
  {
    key: "streak_7",
    name: "一周之星",
    description: "连续学习7天",
    icon: "⭐",
    category: "streak",
    requirement: 7,
    xpReward: 70,
  },
  {
    key: "streak_30",
    name: "月度学霸",
    description: "连续学习30天",
    icon: "💎",
    category: "streak",
    requirement: 30,
    xpReward: 300,
  },
  {
    key: "streak_100",
    name: "坚持王者",
    description: "连续学习100天",
    icon: "👑",
    category: "streak",
    requirement: 100,
    xpReward: 1000,
  },
  {
    key: "words_50",
    name: "初学者",
    description: "掌握50个单词",
    icon: "📖",
    category: "vocabulary",
    requirement: 50,
    xpReward: 50,
  },
  {
    key: "words_200",
    name: "单词达人",
    description: "掌握200个单词",
    icon: "📚",
    category: "vocabulary",
    requirement: 200,
    xpReward: 200,
  },
  {
    key: "words_500",
    name: "词汇大师",
    description: "掌握500个单词",
    icon: "🏆",
    category: "vocabulary",
    requirement: 500,
    xpReward: 500,
  },
  {
    key: "words_1000",
    name: "四级通关",
    description: "掌握1000个四级单词",
    icon: "🎓",
    category: "vocabulary",
    requirement: 1000,
    xpReward: 1000,
  },
  {
    key: "reading_10",
    name: "阅读新手",
    description: "完成10篇阅读",
    icon: "📰",
    category: "reading",
    requirement: 10,
    xpReward: 50,
  },
  {
    key: "reading_50",
    name: "阅读爱好者",
    description: "完成50篇阅读",
    icon: "📖",
    category: "reading",
    requirement: 50,
    xpReward: 200,
  },
  {
    key: "writing_5",
    name: "作文起步",
    description: "完成5篇作文",
    icon: "✏️",
    category: "writing",
    requirement: 5,
    xpReward: 50,
  },
  {
    key: "writing_20",
    name: "写作达人",
    description: "完成20篇作文",
    icon: "🖊️",
    category: "writing",
    requirement: 20,
    xpReward: 200,
  },
  {
    key: "dictation_100",
    name: "默写高手",
    description: "累计默写100个单词",
    icon: "🎯",
    category: "dictation",
    requirement: 100,
    xpReward: 100,
  },
  {
    key: "dictation_500",
    name: "默写大师",
    description: "累计默写500个单词",
    icon: "🏅",
    category: "dictation",
    requirement: 500,
    xpReward: 300,
  },
  {
    key: "xp_1000",
    name: "千分达人",
    description: "累计获得1000经验值",
    icon: "💪",
    category: "general",
    requirement: 1000,
    xpReward: 100,
  },
  {
    key: "xp_5000",
    name: "学习精英",
    description: "累计获得5000经验值",
    icon: "🌟",
    category: "general",
    requirement: 5000,
    xpReward: 500,
  },
];

export function getAchievementByKey(key: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.key === key);
}

export function getAchievementsByCategory(category: AchievementDef["category"]): AchievementDef[] {
  return ACHIEVEMENTS.filter((a) => a.category === category);
}
