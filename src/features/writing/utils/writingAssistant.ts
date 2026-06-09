import { normalize } from "@/lib/vocabulary-validator/lemma-normalizer";
import { isInCET4 } from "@/lib/vocabulary-validator/vocabulary-checker";

import type {
  AssistantRequest,
  AssistantResponse,
  SimplifierRequest,
  SimplifierResponse,
} from "../types";

const SIMPLE_TEMPLATES = [
  {
    pattern: /我(?:认为|觉得|想)(.+)/,
    templates: [
      (match: string) => `I think ${match}`,
      (match: string) => `I believe ${match}`,
      (match: string) => `In my opinion, ${match}`,
    ],
  },
  {
    pattern: /(.+)应该(.+)/,
    templates: [
      (m1: string, m2: string) => `${m1} should ${m2}`,
      (m1: string, m2: string) => `${m1} need to ${m2}`,
    ],
  },
  {
    pattern: /(.+)很重要/,
    templates: [(m: string) => `${m} is very important`, (m: string) => `${m} is very necessary`],
  },
  {
    pattern: /我(?:喜欢|爱)(.+)/,
    templates: [
      (m: string) => `I like ${m}`,
      (m: string) => `I enjoy ${m}`,
      (m: string) => `I love ${m}`,
    ],
  },
  {
    pattern: /(.+)对(.+)有好处/,
    templates: [
      (m1: string, m2: string) => `${m1} is good for ${m2}`,
      (m1: string, m2: string) => `${m1} helps ${m2}`,
    ],
  },
  {
    pattern: /(.+)可以帮助(.+)/,
    templates: [
      (m1: string, m2: string) => `${m1} can help ${m2}`,
      (m1: string, m2: string) => `${m1} helps ${m2}`,
    ],
  },
  {
    pattern: /(.+)越来越(.+)/,
    templates: [
      (m1: string, m2: string) => `${m1} is becoming more and more ${m2}`,
      (m1: string, m2: string) => `${m1} is getting more ${m2}`,
    ],
  },
  {
    pattern: /很多人(.+)/,
    templates: [(m: string) => `many people ${m}`, (m: string) => `a lot of people ${m}`],
  },
  {
    pattern: /大学生(.+)/,
    templates: [(m: string) => `college students ${m}`, (m: string) => `university students ${m}`],
  },
];

const SIMPLE_VOCAB_MAP: Record<string, string[]> = {
  运动: ["exercise", "sport", "sports"],
  健康: ["health", "healthy"],
  学习: ["study", "learn", "learning"],
  工作: ["work", "job"],
  生活: ["life", "living"],
  朋友: ["friend", "friends"],
  家庭: ["family"],
  学校: ["school"],
  老师: ["teacher", "teachers"],
  学生: ["student", "students"],
  考试: ["exam", "test", "examination"],
  成绩: ["grade", "score", "result"],
  时间: ["time"],
  钱: ["money"],
  问题: ["problem", "question", "issue"],
  机会: ["chance", "opportunity"],
  经验: ["experience"],
  知识: ["knowledge"],
  能力: ["ability", "skill"],
  成功: ["success", "successful"],
  幸福: ["happiness", "happy"],
  困难: ["difficult", "hard"],
  重要: ["important", "importance"],
  社会: ["society", "social"],
  环境: ["environment", "surroundings"],
  文化: ["culture", "cultural"],
  经济: ["economy", "economic"],
  科技: ["technology", "tech"],
  互联网: ["internet", "online"],
  手机: ["phone", "mobile phone"],
  电脑: ["computer"],
  未来: ["future"],
  旅行: ["travel", "trip", "tour"],
  食物: ["food"],
  音乐: ["music"],
  电影: ["movie", "film"],
  阅读: ["reading", "read"],
  写作: ["writing", "write"],
  语言: ["language"],
  英语: ["English"],
  目标: ["goal", "aim", "target"],
  进步: ["progress", "improvement"],
  习惯: ["habit"],
  帮助: ["help", "assist"],
  保护: ["protect", "guard"],
  发展: ["develop", "development", "growth"],
  提高: ["improve", "raise", "increase"],
  减少: ["reduce", "cut", "lower"],
  改变: ["change", "turn"],
  选择: ["choose", "choice", "select"],
  决定: ["decide", "decision"],
  开始: ["begin", "start"],
  结束: ["end", "finish"],
  完成: ["complete", "finish", "achieve"],
  参加: ["join", "take part in", "attend"],
  支持: ["support", "back"],
  鼓励: ["encourage"],
  影响: ["affect", "influence", "impact"],
  表达: ["express", "show"],
  理解: ["understand", "get"],
  记住: ["remember"],
  忘记: ["forget"],
};

function findAllCET4Words(text: string): string[] {
  const words = text
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((w) => w.length >= 2);

  const cet4Found: string[] = [];
  for (const word of words) {
    if (isInCET4(word)) {
      cet4Found.push(word);
    } else {
      const lemma = normalize(word);
      if (isInCET4(lemma)) {
        cet4Found.push(lemma);
      }
    }
  }
  return [...new Set(cet4Found)];
}

function matchTemplate(chineseIdea: string): string[] {
  for (const { pattern, templates } of SIMPLE_TEMPLATES) {
    const match = chineseIdea.match(pattern);
    if (match) {
      const groups = match.slice(1);
      const translated = groups.map((g) => translateFragment(g));
      return templates
        .map((tmpl) => {
          try {
            const result = tmpl(...(translated as [string, string]));
            return result;
          } catch {
            return null;
          }
        })
        .filter((s): s is string => s !== null && s.length > 0);
    }
  }
  return [];
}

function translateFragment(fragment: string): string {
  fragment = fragment.trim();
  if (!fragment) return "";

  for (const [cn, enList] of Object.entries(SIMPLE_VOCAB_MAP)) {
    if (fragment === cn) return enList[0];
    if (fragment.startsWith(cn)) {
      const rest = fragment.slice(cn.length).trim();
      if (!rest) return enList[0];
      return `${enList[0]} ${translateFragment(rest)}`;
    }
  }

  const words = fragment.split("");
  const result: string[] = [];

  let i = 0;
  while (i < words.length) {
    let found = false;
    for (let len = Math.min(4, words.length - i); len >= 1; len--) {
      const chunk = words.slice(i, i + len).join("");
      const en = SIMPLE_VOCAB_MAP[chunk];
      if (en) {
        result.push(en[0]);
        i += len;
        found = true;
        break;
      }
    }
    if (!found) {
      const ch = words[i];
      const en = SIMPLE_VOCAB_MAP[ch];
      if (en) result.push(en[0]);
      i++;
    }
  }

  return result.join(" ");
}

function generateSimpleSentences(idea: string): string[] {
  const results: string[] = [];

  const templateResults = matchTemplate(idea);
  results.push(...templateResults);

  const fragments = idea.split(/[，,、\s]+/).filter(Boolean);

  for (const fragment of fragments) {
    const translated = translateFragment(fragment);
    if (translated && translated.length > 5 && !results.includes(translated)) {
      results.push(translated);
    }
  }

  if (results.length === 0) {
    const allTranslated = fragments.map(translateFragment).filter(Boolean);
    if (allTranslated.length > 0) {
      results.push(allTranslated.join(". "));
    }
  }

  return results.slice(0, 5);
}

export function getAssistantSuggestions(request: AssistantRequest): AssistantResponse {
  const { chineseIdea } = request;

  const suggestions = generateSimpleSentences(chineseIdea);

  const allUsedWords: string[] = [];
  for (const suggestion of suggestions) {
    const cet4InSuggestion = findAllCET4Words(suggestion);
    allUsedWords.push(...cet4InSuggestion);
  }

  return {
    suggestions,
    usedWords: [...new Set(allUsedWords)].slice(0, 20),
  };
}

export function simplifyText(request: SimplifierRequest): SimplifierResponse {
  const { originalText } = request;
  const changes: SimplifierResponse["changes"] = [];

  const hardWords: Record<string, string> = {
    phenomenon: "problem",
    significant: "important",
    utilize: "use",
    demonstrate: "show",
    commence: "begin",
    terminate: "end",
    sufficient: "enough",
    beneficial: "helpful",
    detrimental: "harmful",
    advantageous: "useful",
    consequently: "so",
    nevertheless: "but",
    furthermore: "also",
    moreover: "also",
    however: "but",
    therefore: "so",
    thus: "so",
    obtain: "get",
    require: "need",
    purchase: "buy",
    assist: "help",
    attempt: "try",
    possess: "have",
    numerous: "many",
    substantial: "large",
    implement: "carry out",
    sophisticated: "complex",
    magnificent: "great",
    tremendous: "very big",
    enormous: "very big",
    extraordinary: "special",
    exceptional: "very good",
    remarkable: "great",
    accomplish: "achieve",
    endeavor: "try",
    initiate: "start",
  };

  let simplifiedText = originalText;

  const wordRegex = /\b[a-zA-Z]+\b/g;
  let match;

  while ((match = wordRegex.exec(originalText)) !== null) {
    const word = match[0];
    const lower = word.toLowerCase();

    if (hardWords[lower]) {
      const replacement = hardWords[lower];
      const preserveCase =
        word[0] === word[0].toUpperCase()
          ? replacement[0].toUpperCase() + replacement.slice(1)
          : replacement;

      changes.push({
        original: word,
        simplified: preserveCase,
        reason: `"${word}" 替换为更简单的 "${preserveCase}"`,
      });
    }
  }

  for (const change of changes) {
    const regex = new RegExp(`\\b${change.original}\\b`, "g");
    simplifiedText = simplifiedText.replace(regex, change.simplified);
  }

  if (simplifiedText.length > 200) {
    const sentences = simplifiedText.split(/(?<=[.!?])\s+/);
    if (sentences.length > 8) {
      simplifiedText = sentences.slice(0, 8).join(" ");
    }
  }

  return {
    simplifiedText,
    changes,
  };
}
