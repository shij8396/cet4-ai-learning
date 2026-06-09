import type { TokenResult, ContractionRule } from "./types";

const CONTRACTION_RULES: ContractionRule[] = [
  { pattern: /^don['']t$/i, expansions: ["do", "not"] },
  { pattern: /^doesn['']t$/i, expansions: ["does", "not"] },
  { pattern: /^didn['']t$/i, expansions: ["did", "not"] },
  { pattern: /^won['']t$/i, expansions: ["will", "not"] },
  { pattern: /^wouldn['']t$/i, expansions: ["would", "not"] },
  { pattern: /^shouldn['']t$/i, expansions: ["should", "not"] },
  { pattern: /^couldn['']t$/i, expansions: ["could", "not"] },
  { pattern: /^can['']t$/i, expansions: ["can", "not"] },
  { pattern: /^isn['']t$/i, expansions: ["is", "not"] },
  { pattern: /^aren['']t$/i, expansions: ["are", "not"] },
  { pattern: /^wasn['']t$/i, expansions: ["was", "not"] },
  { pattern: /^weren['']t$/i, expansions: ["were", "not"] },
  { pattern: /^hasn['']t$/i, expansions: ["has", "not"] },
  { pattern: /^haven['']t$/i, expansions: ["have", "not"] },
  { pattern: /^hadn['']t$/i, expansions: ["had", "not"] },
  { pattern: /^it['']s$/i, expansions: ["it", "is"] },
  { pattern: /^that['']s$/i, expansions: ["that", "is"] },
  { pattern: /^what['']s$/i, expansions: ["what", "is"] },
  { pattern: /^who['']s$/i, expansions: ["who", "is"] },
  { pattern: /^where['']s$/i, expansions: ["where", "is"] },
  { pattern: /^there['']s$/i, expansions: ["there", "is"] },
  { pattern: /^here['']s$/i, expansions: ["here", "is"] },
  { pattern: /^I['']m$/i, expansions: ["i", "am"] },
  { pattern: /^you['']re$/i, expansions: ["you", "are"] },
  { pattern: /^we['']re$/i, expansions: ["we", "are"] },
  { pattern: /^they['']re$/i, expansions: ["they", "are"] },
  { pattern: /^I['']ve$/i, expansions: ["i", "have"] },
  { pattern: /^you['']ve$/i, expansions: ["you", "have"] },
  { pattern: /^we['']ve$/i, expansions: ["we", "have"] },
  { pattern: /^they['']ve$/i, expansions: ["they", "have"] },
  { pattern: /^I['']ll$/i, expansions: ["i", "will"] },
  { pattern: /^you['']ll$/i, expansions: ["you", "will"] },
  { pattern: /^he['']ll$/i, expansions: ["he", "will"] },
  { pattern: /^she['']ll$/i, expansions: ["she", "will"] },
  { pattern: /^we['']ll$/i, expansions: ["we", "will"] },
  { pattern: /^they['']ll$/i, expansions: ["they", "will"] },
  { pattern: /^I['']d$/i, expansions: ["i", "would"] },
  { pattern: /^you['']d$/i, expansions: ["you", "would"] },
  { pattern: /^he['']d$/i, expansions: ["he", "would"] },
  { pattern: /^she['']d$/i, expansions: ["she", "would"] },
  { pattern: /^we['']d$/i, expansions: ["we", "would"] },
  { pattern: /^they['']d$/i, expansions: ["they", "would"] },
  { pattern: /^let['']s$/i, expansions: ["let", "us"] },
  { pattern: /^ain['']t$/i, expansions: ["am", "not"] },
  { pattern: /^y['']all$/i, expansions: ["you", "all"] },
  { pattern: /^gonna$/i, expansions: ["going", "to"] },
  { pattern: /^wanna$/i, expansions: ["want", "to"] },
  { pattern: /^gotta$/i, expansions: ["got", "to"] },
  { pattern: /^kinda$/i, expansions: ["kind", "of"] },
  { pattern: /^sorta$/i, expansions: ["sort", "of"] },
  { pattern: /^lemme$/i, expansions: ["let", "me"] },
  { pattern: /^gimme$/i, expansions: ["give", "me"] },
  { pattern: /^c['']mon$/i, expansions: ["come", "on"] },
];

const PUNCTUATION_REGEX = /[^a-zA-Z\s'-]/g;
const MULTI_SPACE_REGEX = /\s+/g;
const APOSTROPHE_QUOTE_REGEX = /[\u2018\u2019]/g;

function normalizeApostrophes(text: string): string {
  return text.replace(APOSTROPHE_QUOTE_REGEX, "'");
}

function removePunctuation(text: string): string {
  return text.replace(PUNCTUATION_REGEX, " ").replace(MULTI_SPACE_REGEX, " ").trim();
}

function splitTokens(text: string): string[] {
  return text.split(" ").filter((w) => w.length > 0);
}

function handleContraction(token: string): TokenResult {
  const lower = token.toLowerCase();

  for (const rule of CONTRACTION_RULES) {
    if (rule.pattern.test(lower)) {
      return {
        original: token,
        normalized: lower,
        isContraction: true,
        expandedTokens: rule.expansions,
      };
    }
  }

  return {
    original: token,
    normalized: lower,
    isContraction: false,
    expandedTokens: [lower],
  };
}

export function tokenize(text: string): string[] {
  const result: string[] = [];

  const processed = normalizeApostrophes(text);
  const cleaned = removePunctuation(processed);
  const rawTokens = splitTokens(cleaned);

  for (const token of rawTokens) {
    const tokenResult = handleContraction(token);
    for (const expanded of tokenResult.expandedTokens) {
      const normalized = expanded.toLowerCase().trim();
      if (normalized.length >= 2) {
        result.push(normalized);
      }
    }
  }

  return result;
}

export function tokenizeDetailed(text: string): TokenResult[] {
  const result: TokenResult[] = [];

  const processed = normalizeApostrophes(text);
  const cleaned = removePunctuation(processed);
  const rawTokens = splitTokens(cleaned);

  for (const token of rawTokens) {
    result.push(handleContraction(token));
  }

  return result;
}

export function tokenizeWithPositions(text: string): Array<{
  token: string;
  start: number;
  end: number;
}> {
  const result: Array<{ token: string; start: number; end: number }> = [];
  const processed = normalizeApostrophes(text);

  const wordRegex = /[a-zA-Z]+(?:[''][a-zA-Z]+)*/g;
  let match;

  while ((match = wordRegex.exec(processed)) !== null) {
    const token = match[0].toLowerCase();
    if (token.length >= 2) {
      result.push({
        token,
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  return result;
}

export function getUniqueTokens(tokens: string[]): string[] {
  return [...new Set(tokens)];
}

export function getTokenFrequency(tokens: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const token of tokens) {
    freq.set(token, (freq.get(token) || 0) + 1);
  }
  return freq;
}
