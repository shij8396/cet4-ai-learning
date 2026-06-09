import { useEffect, useRef, useCallback } from "react";

import { useWritingStore } from "../store/writingStore";

import type { WritingDraft } from "../types";

const SAVE_INTERVAL_MS = 5000;

export function useAutoSave() {
  const { content, title, isDirty, draft, addDraft, removeDraft, setIsDirty, setIsSaving } =
    useWritingStore();

  const lastSavedContentRef = useRef<string>("");
  const lastSavedTitleRef = useRef<string>("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const save = useCallback(() => {
    const currentContent = content.trim();
    const currentTitle = title.trim();

    if (
      currentContent === lastSavedContentRef.current &&
      currentTitle === lastSavedTitleRef.current
    ) {
      return;
    }

    if (!currentContent && !currentTitle) {
      if (draft) {
        removeDraft(draft.id);
      }
      return;
    }

    setIsSaving(true);

    const newDraft: WritingDraft = {
      id: draft?.id ?? `draft_${Date.now()}`,
      title: currentTitle || "未命名作文",
      content: currentContent,
      savedAt: Date.now(),
    };

    addDraft(newDraft);
    lastSavedContentRef.current = currentContent;
    lastSavedTitleRef.current = currentTitle;
    setIsDirty(false);
    setIsSaving(false);
  }, [content, title, draft, addDraft, removeDraft, setIsDirty, setIsSaving]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      save();
    }, SAVE_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [save]);

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden && isDirty) {
      save();
    }
  }, [isDirty, save]);

  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  return {
    save,
    lastSaved: draft?.savedAt ?? null,
  };
}
