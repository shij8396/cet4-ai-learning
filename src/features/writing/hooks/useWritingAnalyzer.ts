import { useCallback, useRef, useEffect } from "react";

import { useWritingStore } from "../store/writingStore";
import {
  analyzeText,
  calculateWritingScore,
  calculateCoverage,
} from "../validators/writingValidator";

const ANALYSIS_DEBOUNCE_MS = 600;

export function useWritingAnalyzer() {
  const { content, masteredWords, setAnalysis, setScore, setCoverageReport, setIsAnalyzing } =
    useWritingStore();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastContentRef = useRef<string>("");

  const triggerAnalysis = useCallback(() => {
    if (content === lastContentRef.current) return;

    setIsAnalyzing(true);

    const analysis = analyzeText(content, masteredWords);
    setAnalysis(analysis);

    const score = calculateWritingScore(content, analysis);
    setScore(score);

    const coverage = calculateCoverage(analysis.words);
    setCoverageReport(coverage);

    lastContentRef.current = content;
    setIsAnalyzing(false);
  }, [content, masteredWords, setAnalysis, setScore, setCoverageReport, setIsAnalyzing]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      triggerAnalysis();
    }, ANALYSIS_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [content, triggerAnalysis]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);
}
