import { api } from "@/lib/api-client";

import { getAssistantSuggestions, simplifyText } from "../utils/writingAssistant";

import type {
  AssistantRequest,
  AssistantResponse,
  HistoryRecord,
  SimplifierRequest,
  SimplifierResponse,
} from "../types";

const API_BASE = "/api/v1/vocabulary/writing";

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
  return api.post<{ id: string }>(API_BASE, data);
}

export async function getWritingHistory(): Promise<HistoryRecord[]> {
  const data = await api.get<{ records?: HistoryRecord[] }>(API_BASE);
  return data.records ?? [];
}

export async function getWritingRecord(
  id: string,
): Promise<HistoryRecord & { correctedContent?: string; suggestions?: unknown[] }> {
  return api.get<HistoryRecord & { correctedContent?: string; suggestions?: unknown[] }>(
    `${API_BASE}?id=${id}`,
  );
}

export async function deleteWritingRecord(id: string): Promise<void> {
  await api.delete(`${API_BASE}?id=${encodeURIComponent(id)}`);
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
  try {
    return await api.post<AssistantResponse>("/api/v1/vocabulary/writing/assistant", request);
  } catch {
    return getLocalAssistantSuggestions(request);
  }
}

export async function getAISimplifiedText(request: SimplifierRequest): Promise<SimplifierResponse> {
  try {
    return await api.post<SimplifierResponse>("/api/v1/vocabulary/writing/simplify", request);
  } catch {
    return getLocalSimplifiedText(request);
  }
}
