import { getAssistantSuggestions, simplifyText } from "../utils/writingAssistant";

import type {
  AssistantRequest,
  AssistantResponse,
  SimplifierRequest,
  SimplifierResponse,
  HistoryRecord,
} from "../types";

const API_BASE = "/api/vocabulary/writing";

export async function saveWritingRecord(data: {
  title?: string;
  content: string;
  score?: number;
  grammarErrors?: unknown;
  spellingErrors?: unknown;
  outOfLevelWords?: string[];
  vocabularyCoverage?: number;
  writingTime?: number;
}): Promise<{ id: string }> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("保存作文失败");
  }

  return res.json();
}

export async function getWritingHistory(): Promise<HistoryRecord[]> {
  const res = await fetch(API_BASE);

  if (!res.ok) {
    throw new Error("获取历史记录失败");
  }

  const data = await res.json();
  return data.records ?? [];
}

export async function getWritingRecord(
  id: string,
): Promise<HistoryRecord & { correctedContent?: string; suggestions?: unknown[] }> {
  const res = await fetch(`${API_BASE}?id=${id}`);

  if (!res.ok) {
    throw new Error("获取作文详情失败");
  }

  return res.json();
}

export function getLocalAssistantSuggestions(request: AssistantRequest): AssistantResponse {
  return getAssistantSuggestions(request);
}

export function getLocalSimplifiedText(request: SimplifierRequest): SimplifierResponse {
  return simplifyText(request);
}

export async function getAIAssistantSuggestions(
  request: AssistantRequest,
): Promise<AssistantResponse> {
  const res = await fetch("/api/vocabulary/writing/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    return getLocalAssistantSuggestions(request);
  }

  return res.json();
}

export async function getAISimplifiedText(request: SimplifierRequest): Promise<SimplifierResponse> {
  const res = await fetch("/api/vocabulary/writing/simplify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    return getLocalSimplifiedText(request);
  }

  return res.json();
}
