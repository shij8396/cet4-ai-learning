"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Header } from "@/components/layout/Header";
import { PageLoading } from "@/components/shared/LoadingSpinner";
import { DictationCompleted } from "@/features/dictation/components/DictationCompleted";
import { DictationFeedback } from "@/features/dictation/components/DictationFeedback";
import { DictationInput } from "@/features/dictation/components/DictationInput";
import { DictationModeSelector } from "@/features/dictation/components/DictationModeSelector";
import { DictationProgress } from "@/features/dictation/components/DictationProgress";
import { useDictationStore } from "@/features/dictation/store/dictationStore";
import { useAudioStore } from "@/stores";
import { useWordCacheStore } from "@/stores/wordCacheStore";

import type {
  DictationMode,
  DictationPrompt,
  DictationWord,
} from "@/features/dictation/services/dictationEngine";
import type { SessionScore } from "@/features/dictation/utils/scoringEngine";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function generatePromptFromWord(word: DictationWord, mode: DictationMode): DictationPrompt {
  const exampleWithBlank = word.example
    ? word.example.replace(new RegExp(`\\b${escapeRegex(word.word)}\\b`, "i"), "____")
    : null;

  return {
    prompt:
      mode === "listen_to_en"
        ? word.phonetic || word.word
        : mode === "fill_in_blank" && exampleWithBlank
          ? exampleWithBlank
          : word.meaning,
    correctAnswer: word.word,
    wordId: word.wordId,
    word: word.word,
    phonetic: word.phonetic,
    hint: word.meaning,
    type: mode,
    example: word.example,
    exampleCn: word.exampleCn,
    exampleWithBlank,
  };
}

export default function DictationPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"select" | "dictation" | "completed">("select");
  const [sessionScore, setSessionScore] = useState<SessionScore | null>(null);

  const { words, loading, fetchWords } = useWordCacheStore();
  const {
    mode,
    setMode,
    prompts,
    setPrompts,
    currentIndex,
    startSession,
    submitAnswer,
    skipWord,
    retryWord,
    nextWord,
    endSession,
    resetSession,
    results,
    showResult,
    lastResult,
    streak,
    wrongWords,
  } = useDictationStore();
  const { play } = useAudioStore();

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  const dictationWords = useMemo<DictationWord[]>(
    () =>
      words.slice(0, 30).map((word) => ({
        wordId: word.id,
        word: word.word,
        meaning: word.meaning,
        phonetic: word.phonetic,
        partOfSpeech: word.partOfSpeech,
        example: word.example,
        exampleCn: word.exampleCn,
        masteryLevel: word.progress?.masteryLevel ?? 0,
        wrongCount: 0,
      })),
    [words],
  );

  const handleStartSession = useCallback(
    (selectedMode: DictationMode) => {
      if (dictationWords.length === 0) return;

      setMode(selectedMode);
      setPrompts(
        dictationWords.slice(0, 10).map((word) => generatePromptFromWord(word, selectedMode)),
      );
      startSession();
      setPhase("dictation");
    },
    [dictationWords, setMode, setPrompts, startSession],
  );

  const currentPrompt = useMemo(
    () => (currentIndex < prompts.length ? prompts[currentIndex] : null),
    [currentIndex, prompts],
  );

  const handleNextWord = useCallback(() => {
    if (currentIndex >= prompts.length - 1) {
      const score = endSession();
      setSessionScore(score);
      setPhase("completed");
    } else {
      nextWord();
    }
  }, [currentIndex, prompts.length, endSession, nextWord]);

  const handleRetryWrong = useCallback(() => {
    if (wrongWords.length === 0) return;

    setPrompts(wrongWords.map((word) => ({ ...word, type: "review" as DictationMode })));
    startSession();
    setPhase("dictation");
  }, [wrongWords, setPrompts, startSession]);

  const handleNewSession = useCallback(() => {
    resetSession();
    setPhase("select");
    setSessionScore(null);
  }, [resetSession]);

  const handlePlayAudio = useCallback(() => {
    if (currentPrompt) play(currentPrompt.word);
  }, [currentPrompt, play]);

  if (loading && dictationWords.length === 0) return <PageLoading />;

  if (phase === "select") {
    return (
      <div className="min-h-screen bg-background">
        <Header title="单词默写" showBack />
        <div className="mx-auto max-w-lg px-4 py-6">
          <DictationModeSelector
            selectedMode={mode}
            onSelect={handleStartSession}
            wordCount={Math.min(dictationWords.length, 10)}
          />
        </div>
      </div>
    );
  }

  if (phase === "completed" && sessionScore) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="默写结果" />
        <div className="mx-auto max-w-lg px-4 py-6">
          <DictationCompleted
            score={sessionScore}
            results={results}
            wrongWords={wrongWords}
            onRetryWrong={handleRetryWrong}
            onNewSession={handleNewSession}
            onGoHome={() => {
              resetSession();
              router.push("/");
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header
        title="单词默写"
        showBack
        onBack={() => {
          const score = endSession();
          if (results.length > 0) {
            setSessionScore(score);
            setPhase("completed");
          } else {
            resetSession();
            setPhase("select");
          }
        }}
      />

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-4">
        <DictationProgress
          currentIndex={currentIndex}
          totalWords={prompts.length}
          results={results}
          streak={streak}
        />

        <div className="flex flex-1 flex-col justify-center py-6">
          {currentPrompt && (
            <>
              <div className="mb-6 text-center">
                {currentPrompt.type === "listen_to_en" ? (
                  <p className="mb-2 text-sm text-muted-foreground">听发音写出单词</p>
                ) : currentPrompt.type === "fill_in_blank" ? (
                  <p className="mb-2 text-sm text-muted-foreground">填入合适的单词</p>
                ) : (
                  <p className="mb-2 text-sm text-muted-foreground">请写出对应的英文单词</p>
                )}

                {currentPrompt.type !== "listen_to_en" && (
                  <div className="rounded-xl bg-muted/30 p-4">
                    <h2 className="text-2xl font-bold">{currentPrompt.prompt}</h2>
                    {currentPrompt.type === "fill_in_blank" && currentPrompt.exampleCn && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {currentPrompt.exampleCn}
                      </p>
                    )}
                    {currentPrompt.type === "fill_in_blank" &&
                      currentPrompt.hint !== currentPrompt.prompt && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          提示：{currentPrompt.hint}
                        </p>
                      )}
                  </div>
                )}
              </div>

              {showResult && lastResult ? (
                <DictationFeedback
                  result={lastResult}
                  streak={streak}
                  isLastWord={currentIndex >= prompts.length - 1}
                  onNext={handleNextWord}
                  onRetry={retryWord}
                  onFinish={() => {
                    const score = endSession();
                    setSessionScore(score);
                    setPhase("completed");
                  }}
                />
              ) : (
                <DictationInput
                  prompt={currentPrompt}
                  onSubmit={submitAnswer}
                  onPlayAudio={handlePlayAudio}
                />
              )}
            </>
          )}
        </div>

        <div className="flex justify-center pb-4">
          <button
            onClick={() => {
              skipWord();
              if (currentIndex >= prompts.length - 1) {
                const score = endSession();
                setSessionScore(score);
                setPhase("completed");
              }
            }}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            跳过此题
          </button>
        </div>
      </div>
    </div>
  );
}
