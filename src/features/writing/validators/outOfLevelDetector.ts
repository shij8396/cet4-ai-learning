import { cet4Words } from "@/data/cet4Words";
import { normalize } from "@/lib/vocabulary-validator/lemma-normalizer";
import { isInCET4 } from "@/lib/vocabulary-validator/vocabulary-checker";

const PREPOSITIONS = new Set([
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "from",
  "by",
  "about",
  "into",
  "through",
  "during",
  "before",
  "after",
  "above",
  "below",
  "between",
  "under",
  "over",
  "without",
  "within",
  "along",
  "among",
  "upon",
  "across",
  "behind",
  "beside",
  "against",
  "toward",
  "towards",
  "around",
  "off",
]);

const ARTICLES = new Set(["a", "an", "the"]);

const PRONOUNS = new Set([
  "i",
  "you",
  "he",
  "she",
  "it",
  "we",
  "they",
  "me",
  "him",
  "her",
  "us",
  "them",
  "my",
  "your",
  "his",
  "its",
  "our",
  "their",
  "mine",
  "yours",
  "hers",
  "ours",
  "theirs",
  "myself",
  "yourself",
  "himself",
  "herself",
  "itself",
  "ourselves",
  "yourselves",
  "themselves",
  "this",
  "that",
  "these",
  "those",
  "who",
  "whom",
  "whose",
  "which",
  "what",
]);

const CONJUNCTIONS = new Set([
  "and",
  "but",
  "or",
  "so",
  "yet",
  "for",
  "nor",
  "because",
  "although",
  "though",
  "while",
  "if",
  "when",
  "where",
  "whether",
  "unless",
  "until",
  "since",
  "as",
  "than",
  "that",
]);

const AUXILIARY_VERBS = new Set([
  "am",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "having",
  "do",
  "does",
  "did",
  "doing",
  "will",
  "would",
  "shall",
  "should",
  "can",
  "could",
  "may",
  "might",
  "must",
  "need",
  "dare",
  "ought",
]);

const COMMON_ADVERBS = new Set([
  "not",
  "no",
  "yes",
  "very",
  "too",
  "also",
  "just",
  "now",
  "then",
  "here",
  "there",
  "always",
  "never",
  "often",
  "sometimes",
  "usually",
  "really",
  "only",
  "still",
  "already",
  "quite",
  "almost",
  "enough",
  "even",
  "ever",
  "yet",
  "ago",
  "today",
  "tomorrow",
  "yesterday",
  "perhaps",
  "maybe",
  "however",
  "therefore",
]);

const FUNCTION_WORDS = new Set([
  ...PREPOSITIONS,
  ...ARTICLES,
  ...PRONOUNS,
  ...CONJUNCTIONS,
  ...AUXILIARY_VERBS,
  ...COMMON_ADVERBS,
]);

const CET4_WORD_SET = new Set(cet4Words.map((w) => w.word.toLowerCase()));

const CET4_WORDS_BY_FREQ = [...cet4Words]
  .sort((a, b) => (b.frequency ?? 0) - (a.frequency ?? 0))
  .map((w) => w.word);

function getSimilarityScore(a: string, b: string): number {
  if (a === b) return 100;
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();
  if (aLower === bLower) return 100;

  let score = 0;
  const maxLen = Math.max(aLower.length, bLower.length);
  const minLen = Math.min(aLower.length, bLower.length);

  if (Math.abs(aLower.length - bLower.length) <= 2) score += 10;

  let matchCount = 0;
  for (let i = 0; i < minLen; i++) {
    if (aLower[i] === bLower[i]) matchCount++;
  }
  score += (matchCount / maxLen) * 30;

  const setA = new Set(aLower);
  const setB = new Set(bLower);
  const intersection = new Set([...setA].filter((c) => setB.has(c)));
  score += (intersection.size / Math.max(setA.size, setB.size)) * 20;

  const aNorm = normalize(aLower);
  const bNorm = normalize(bLower);
  if (aNorm === bNorm) score += 25;

  return score;
}

function getCET4Names(word: string): string[] {
  const lower = word.toLowerCase();
  if (CET4_WORD_SET.has(lower)) return [word];

  const normalized = normalize(lower);
  if (CET4_WORD_SET.has(normalized)) {
    const meta = cet4Words.find((w) => w.word.toLowerCase() === normalized);
    return meta ? [meta.word] : [normalized];
  }

  const candidates: Array<{ word: string; score: number }> = [];

  for (const entry of cet4Words) {
    const entryWord = entry.word;
    const score = getSimilarityScore(lower, entryWord);

    if (score > 30) {
      candidates.push({
        word: entryWord,
        score: score + (entry.frequency ?? 1) * 2,
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  const result = candidates.slice(0, 5).map((c) => c.word);

  if (result.length === 0) {
    const freqBased = CET4_WORDS_BY_FREQ.filter(
      (w) => w.toLowerCase().length >= Math.max(3, lower.length - 3),
    ).slice(0, 3);
    return freqBased;
  }

  return result;
}

export function isFunctionWord(word: string): boolean {
  return FUNCTION_WORDS.has(word.toLowerCase());
}

export function isOutOfLevel(word: string): boolean {
  const lower = word.toLowerCase().trim();
  if (lower.length < 3) return false;
  if (isFunctionWord(lower)) return false;
  if (isInCET4(lower)) return false;

  const lemma = normalize(lower);
  if (isInCET4(lemma)) return false;

  return true;
}

export function getOutOfLevelReplacements(word: string, maxResults = 3): string[] {
  const lower = word.toLowerCase().trim();
  if (lower.length < 3) return [];
  if (isFunctionWord(lower)) return [];
  if (!isOutOfLevel(lower)) return [];

  return getCET4Names(lower).slice(0, maxResults);
}

export function detectOutOfLevelWords(text: string): Array<{
  word: string;
  start: number;
  end: number;
  replacements: string[];
}> {
  const results: Array<{
    word: string;
    start: number;
    end: number;
    replacements: string[];
  }> = [];

  const wordRegex = /[a-zA-Z]+(?:'[a-zA-Z]+)*/g;
  let match;

  while ((match = wordRegex.exec(text)) !== null) {
    const word = match[0];
    if (isOutOfLevel(word)) {
      results.push({
        word,
        start: match.index,
        end: match.index + word.length,
        replacements: getOutOfLevelReplacements(word),
      });
    }
  }

  return results;
}

export function getWordColor(word: string): string | null {
  const lower = word.toLowerCase();
  if (isFunctionWord(lower)) return null;
  if (isOutOfLevel(lower)) return "outOfLevel";
  if (isInCET4(lower)) return "cet4";
  return "unknown";
}

export function isHighFrequencyCET4(word: string): boolean {
  const lower = word.toLowerCase();
  const meta = cet4Words.find((w) => w.word.toLowerCase() === lower);
  return (meta?.frequency ?? 0) >= 4;
}
