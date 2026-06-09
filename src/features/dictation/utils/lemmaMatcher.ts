import { getLemma, normalize, analyzeWord } from "@/lib/vocabulary-validator/lemma-normalizer";

export type LemmaMatchResult = "exact_match" | "lemma_match" | "inflection_match" | "no_match";

export interface LemmaAnalysis {
  input: string;
  target: string;
  inputLemma: string;
  targetLemma: string;
  matchType: LemmaMatchResult;
  needsExactForm: boolean;
  explanation: string;
}

export function compareLemmas(input: string, target: string): LemmaAnalysis {
  const inputLower = input.toLowerCase().trim();
  const targetLower = target.toLowerCase().trim();

  if (inputLower === targetLower) {
    return {
      input: inputLower,
      target: targetLower,
      inputLemma: targetLower,
      targetLemma: targetLower,
      matchType: "exact_match",
      needsExactForm: false,
      explanation: "完全相同",
    };
  }

  const inputLemma = getLemma(inputLower);
  const targetLemma = getLemma(targetLower);

  if (inputLemma === targetLemma) {
    return {
      input: inputLower,
      target: targetLower,
      inputLemma,
      targetLemma,
      matchType: "lemma_match",
      needsExactForm: false,
      explanation: "词根匹配",
    };
  }

  const inputAnalysis = analyzeWord(inputLower);
  const targetAnalysis = analyzeWord(targetLower);

  if (
    !inputAnalysis.isBaseForm &&
    !targetAnalysis.isBaseForm &&
    inputAnalysis.possibleForms.some((f) => targetAnalysis.possibleForms.includes(f))
  ) {
    return {
      input: inputLower,
      target: targetLower,
      inputLemma,
      targetLemma,
      matchType: "inflection_match",
      needsExactForm: false,
      explanation: "词形变体匹配",
    };
  }

  return {
    input: inputLower,
    target: targetLower,
    inputLemma,
    targetLemma,
    matchType: "no_match",
    needsExactForm: true,
    explanation: "不匹配",
  };
}

export function isAcceptableAnswer(
  input: string,
  target: string,
  requireExactForm: boolean = false,
): boolean {
  const result = compareLemmas(input, target);

  if (requireExactForm) {
    return result.matchType === "exact_match";
  }

  return (
    result.matchType === "exact_match" ||
    result.matchType === "lemma_match" ||
    result.matchType === "inflection_match"
  );
}

export function getTargetForms(target: string, mode: string): string[] {
  const forms: string[] = [target.toLowerCase()];

  if (mode === "fill_in_blank") {
    const lemma = getLemma(target);
    if (lemma !== target.toLowerCase()) {
      forms.unshift(lemma);
    }
    forms.push(normalize(target));
  }

  return [...new Set(forms)];
}
