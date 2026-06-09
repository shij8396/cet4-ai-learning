import { cet4Words } from "@/data/cet4Words";
import { normalize } from "@/lib/vocabulary-validator/lemma-normalizer";
import { checkLevel } from "@/lib/vocabulary-validator/level-checker";
import { spellCheck } from "@/lib/vocabulary-validator/spell-checker";
import { tokenizeWithPositions } from "@/lib/vocabulary-validator/tokenizer";
import { isInCET4 } from "@/lib/vocabulary-validator/vocabulary-checker";

import type { WordAnalysis, RealTimeAnalysis, WritingScore, CoverageReport } from "../types";

const HIGH_FREQUENCY_THRESHOLD = 4;
const REPETITION_THRESHOLD = 4;

function getCET4WordMeta(word: string) {
  const lower = word.toLowerCase();
  return cet4Words.find((w) => w.word.toLowerCase() === lower);
}

function getCET4Alternatives(word: string, maxResults = 3): string[] {
  const lower = word.toLowerCase();
  const normalized = normalize(lower);

  if (isInCET4(lower)) return [];

  const candidates: Array<{ word: string; score: number }> = [];

  for (const entry of cet4Words) {
    const entryWord = entry.word.toLowerCase();
    if (entryWord === lower || entryWord === normalized) continue;
    if (entryWord.length < 3) continue;

    let score = 0;
    const lenDiff = Math.abs(entryWord.length - lower.length);
    if (lenDiff <= 2) score += 10 - lenDiff * 3;

    const firstChar = lower[0];
    if (entryWord[0] === firstChar) score += 5;

    let commonChars = 0;
    for (const c of lower) {
      if (entryWord.includes(c)) commonChars++;
    }
    score += commonChars;

    const entryFreq = entry.frequency ?? 1;
    score += entryFreq;

    if (score > 0) {
      candidates.push({ word: entry.word, score });
    }
  }

  return candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((c) => c.word);
}

export function analyzeWord(
  word: string,
  startIndex: number,
  endIndex: number,
  masteredWords: Set<string> = new Set(),
): WordAnalysis {
  const lower = word.toLowerCase();
  const lemma = normalize(lower);
  const spelling = spellCheck(lower);
  const isSpellingErr = !spelling.isCorrect;

  const meta = getCET4WordMeta(lemma) ?? getCET4WordMeta(lower);

  const inCET4 = isInCET4(lemma) || isInCET4(lower);
  const levelResult = checkLevel(lower);
  const isOutOfLevel = levelResult.isOutOfLevel || !inCET4;
  const isMastered = masteredWords.has(lower) || masteredWords.has(lemma);
  const frequency = meta?.frequency ?? 0;
  const isHighFrequency = frequency >= HIGH_FREQUENCY_THRESHOLD;

  const spellingCorrections = isSpellingErr ? spelling.corrections : [];

  const levelReplacements = isOutOfLevel ? getCET4Alternatives(lower) : [];

  return {
    word: lower,
    startIndex,
    endIndex,
    isSpellingError: isSpellingErr,
    isOutOfLevel,
    isMastered,
    isHighFrequency,
    spellingCorrections,
    levelReplacements,
    frequency,
  };
}

export function analyzeText(
  text: string,
  masteredWords: Set<string> = new Set(),
): RealTimeAnalysis {
  if (!text.trim()) {
    return {
      words: [],
      spellingErrors: [],
      outOfLevelWords: [],
      masteredWords: [],
      highFrequencyWords: [],
      repeatedWords: [],
      vocabularyCoverage: 0,
    };
  }

  const tokenPositions = tokenizeWithPositions(text);
  const words = tokenPositions.map((tp) => analyzeWord(tp.token, tp.start, tp.end, masteredWords));

  const spellingErrors = words.filter((w) => w.isSpellingError);
  const outOfLevelWords = words.filter((w) => w.isOutOfLevel);
  const masteredWordList = words.filter((w) => w.isMastered);
  const highFrequencyWords = words.filter((w) => w.isHighFrequency);

  const freqMap = new Map<string, number>();
  for (const w of words) {
    freqMap.set(w.word, (freqMap.get(w.word) ?? 0) + 1);
  }
  const repeatedWords = [...freqMap.entries()]
    .filter(([, count]) => count >= REPETITION_THRESHOLD)
    .map(([word, count]) => ({ word, count }));

  const uniqueWords = new Set(words.map((w) => w.word));
  const cet4Count = [...uniqueWords].filter((w) => isInCET4(w) || isInCET4(normalize(w))).length;
  const vocabularyCoverage = uniqueWords.size > 0 ? cet4Count / uniqueWords.size : 0;

  return {
    words,
    spellingErrors,
    outOfLevelWords,
    masteredWords: masteredWordList,
    highFrequencyWords,
    repeatedWords,
    vocabularyCoverage,
  };
}

export function calculateWritingScore(text: string, analysis: RealTimeAnalysis): WritingScore {
  const { words, spellingErrors, repeatedWords, vocabularyCoverage } = analysis;

  if (words.length === 0) {
    return {
      overallScore: 0,
      vocabularyScore: 0,
      grammarScore: 0,
      readabilityScore: 0,
      spellingAccuracy: 0,
      cet4UsageRate: 0,
      sentenceFluency: 0,
      grammarCorrectRate: 0,
      repetitionRate: 0,
      structureScore: 0,
      grade: "F",
    };
  }

  const spellingAccuracy =
    words.length > 0 ? (words.length - spellingErrors.length) / words.length : 0;

  const cet4UsageRate = vocabularyCoverage;

  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const totalSentences = Math.max(sentences.length, 1);
  const avgWordsPerSentence = words.length / totalSentences;

  const idealMin = 8;
  const idealMax = 20;
  let sentenceFluency: number;
  if (avgWordsPerSentence < idealMin) {
    sentenceFluency = avgWordsPerSentence / idealMin;
  } else if (avgWordsPerSentence > idealMax) {
    sentenceFluency = Math.max(0, 1 - (avgWordsPerSentence - idealMax) / idealMax);
  } else {
    sentenceFluency = 1;
  }

  const grammarCorrectRate = spellingAccuracy;

  const repeatedRatio =
    words.length > 0
      ? repeatedWords.reduce(
          (sum: number, r: { word: string; count: number }) => sum + r.count,
          0,
        ) / words.length
      : 0;
  const repetitionRate = Math.max(0, 1 - repeatedRatio);

  let structureScore = 0.6;
  if (totalSentences >= 3 && words.length >= 20) structureScore = 0.8;
  if (totalSentences >= 5 && words.length >= 50) structureScore = 0.9;
  if (totalSentences >= 8 && words.length >= 80) structureScore = 1.0;

  const vocabularyScore = Math.round(cet4UsageRate * 100);
  const grammarScore = Math.round(spellingAccuracy * 100);
  const readabilityScore = Math.round(sentenceFluency * 50 + cet4UsageRate * 50);

  const overallScore = Math.round(
    vocabularyScore * 0.25 +
      grammarScore * 0.25 +
      readabilityScore * 0.25 +
      repetitionRate * 100 * 0.15 +
      structureScore * 100 * 0.1,
  );

  let grade: WritingScore["grade"] = "F";
  if (overallScore >= 90) grade = "S";
  else if (overallScore >= 80) grade = "A";
  else if (overallScore >= 65) grade = "B";
  else if (overallScore >= 50) grade = "C";
  else if (overallScore >= 35) grade = "D";

  return {
    overallScore: Math.max(0, Math.min(100, overallScore)),
    vocabularyScore,
    grammarScore,
    readabilityScore,
    spellingAccuracy,
    cet4UsageRate,
    sentenceFluency,
    grammarCorrectRate,
    repetitionRate,
    structureScore,
    grade,
  };
}

export function calculateCoverage(words: WordAnalysis[]): CoverageReport {
  const masteredCount = words.filter((w) => w.isMastered).length;
  const outOfLevelCount = words.filter((w) => w.isOutOfLevel).length;
  const highFreqCount = words.filter((w) => w.isHighFrequency).length;

  const newWordSet = new Set<string>();
  for (const w of words) {
    if (!w.isMastered && !w.isOutOfLevel) {
      newWordSet.add(w.word);
    }
  }

  const coverageScore = Math.round((masteredCount / Math.max(words.length, 1)) * 100);

  return {
    totalWords: words.length,
    masteredWords: masteredCount,
    newWords: newWordSet.size,
    outOfLevelWords: outOfLevelCount,
    highFrequencyWords: highFreqCount,
    coverageScore,
  };
}

export function getWritingSuggestions(text: string, analysis: RealTimeAnalysis) {
  const suggestions: string[] = [];

  if (analysis.spellingErrors.length > 0) {
    suggestions.push(`发现 ${analysis.spellingErrors.length} 个拼写错误，请检查并修正`);
  }

  if (analysis.outOfLevelWords.length > 0) {
    const words = analysis.outOfLevelWords
      .map((w: WordAnalysis) => w.word)
      .slice(0, 5)
      .join(", ");
    suggestions.push(
      `发现 ${analysis.outOfLevelWords.length} 个超纲词汇(${words}...)，建议使用CET4词汇替换`,
    );
  }

  if (analysis.repeatedWords.length > 0) {
    const words = analysis.repeatedWords
      .map((r: { word: string; count: number }) => `${r.word}(×${r.count})`)
      .join(", ");
    suggestions.push(`以下单词重复使用过多: ${words}`);
  }

  if (analysis.vocabularyCoverage < 0.6) {
    suggestions.push("CET4词汇覆盖率较低，建议使用更多已学四级词汇");
  }

  if (analysis.words.length < 20) {
    suggestions.push("文章较短，建议扩展内容，至少写20个词");
  }

  return suggestions;
}
