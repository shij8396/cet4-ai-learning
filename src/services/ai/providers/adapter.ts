import { getAIConfig, getApiKey, isProviderAvailable } from "../config";

import type {
  AIRequest,
  AIResponse,
  AIStreamChunk,
  AIError,
  AIMessage,
  AIProvider,
} from "../types";

function parseAIError(provider: AIProvider, status: number, body: string): AIError {
  const retryable = status === 429 || status >= 500;
  return {
    code: `AI_${status}`,
    message: body || `AI请求失败 (${status})`,
    provider,
    retryable,
  };
}

async function callGemini(messages: AIMessage[], stream: boolean): Promise<Response> {
  const apiKey = getApiKey("gemini");
  const config = getAIConfig("gemini");

  const systemMsg = messages.find((m) => m.role === "system");
  const userMsgs = messages.filter((m) => m.role !== "system");

  const contents = userMsgs.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      maxOutputTokens: config.maxTokens,
      temperature: config.temperature,
      topP: config.topP,
    },
  };

  if (systemMsg) {
    body.systemInstruction = {
      parts: [{ text: systemMsg.content }],
    };
  }

  const url = stream
    ? `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:streamGenerateContent?alt=sse&key=${apiKey}`
    : `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${apiKey}`;

  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function parseGeminiResponse(response: Response): Promise<AIResponse> {
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const usage = data.usageMetadata
    ? {
        promptTokens: data.usageMetadata.promptTokenCount || 0,
        completionTokens: data.usageMetadata.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata.totalTokenCount || 0,
      }
    : undefined;

  return { text, usage, provider: "gemini", model: getAIConfig("gemini").model };
}

async function* parseGeminiStream(response: Response): AsyncGenerator<AIStreamChunk> {
  const reader = response.body?.getReader();
  if (!reader) {
    yield { text: "", done: true };
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
      try {
        const json = JSON.parse(line.slice(6));
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (text) yield { text, done: false };
      } catch {
        continue;
      }
    }
  }

  yield { text: "", done: true };
}

async function callOpenAI(
  provider: AIProvider,
  messages: AIMessage[],
  stream: boolean,
): Promise<Response> {
  const apiKey = getApiKey(provider);
  const config = getAIConfig(provider);

  const body = {
    model: config.model,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    max_tokens: config.maxTokens,
    temperature: config.temperature,
    top_p: config.topP,
    stream,
  };

  const baseUrl =
    provider === "openrouter"
      ? "https://openrouter.ai/api/v1/chat/completions"
      : "https://api.openai.com/v1/chat/completions";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  if (provider === "openrouter") {
    headers["HTTP-Referer"] = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    headers["X-Title"] = "AI CET4 Learning";
  }

  return fetch(baseUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

async function parseOpenAIResponse(provider: AIProvider, response: Response): Promise<AIResponse> {
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "";
  const usage = data.usage
    ? {
        promptTokens: data.usage.prompt_tokens || 0,
        completionTokens: data.usage.completion_tokens || 0,
        totalTokens: data.usage.total_tokens || 0,
      }
    : undefined;

  return { text, usage, provider, model: getAIConfig(provider).model };
}

async function* parseOpenAIStream(
  provider: AIProvider,
  response: Response,
): AsyncGenerator<AIStreamChunk> {
  const reader = response.body?.getReader();
  if (!reader) {
    yield { text: "", done: true };
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
      try {
        const json = JSON.parse(line.slice(6));
        const text = json.choices?.[0]?.delta?.content || "";
        if (text) yield { text, done: false };
      } catch {
        continue;
      }
    }
  }

  yield { text: "", done: true };
}

export async function generateText(
  request: AIRequest,
  providerOverride?: AIProvider,
): Promise<AIResponse> {
  const provider = providerOverride || getAIConfig().provider;

  if (!isProviderAvailable(provider)) {
    throw {
      code: "AI_NO_KEY",
      message: `未配置 ${provider} API Key`,
      provider,
      retryable: false,
    } as AIError;
  }

  let response: Response;

  try {
    if (provider === "gemini") {
      response = await callGemini(request.messages, false);
    } else {
      response = await callOpenAI(provider, request.messages, false);
    }

    if (!response.ok) {
      const body = await response.text();
      throw parseAIError(provider, response.status, body);
    }

    if (provider === "gemini") {
      return await parseGeminiResponse(response);
    } else {
      return await parseOpenAIResponse(provider, response);
    }
  } catch (error) {
    if ((error as AIError).code) throw error;
    throw {
      code: "AI_NETWORK",
      message: (error as Error).message || "网络请求失败",
      provider,
      retryable: true,
    } as AIError;
  }
}

export async function* generateTextStream(
  request: AIRequest,
  providerOverride?: AIProvider,
): AsyncGenerator<AIStreamChunk> {
  const provider = providerOverride || getAIConfig().provider;

  if (!isProviderAvailable(provider)) {
    throw {
      code: "AI_NO_KEY",
      message: `未配置 ${provider} API Key`,
      provider,
      retryable: false,
    } as AIError;
  }

  let response: Response;

  try {
    if (provider === "gemini") {
      response = await callGemini(request.messages, true);
    } else {
      response = await callOpenAI(provider, request.messages, true);
    }

    if (!response.ok) {
      const body = await response.text();
      throw parseAIError(provider, response.status, body);
    }

    if (provider === "gemini") {
      yield* parseGeminiStream(response);
    } else {
      yield* parseOpenAIStream(provider, response);
    }
  } catch (error) {
    if ((error as AIError).code) throw error;
    throw {
      code: "AI_NETWORK",
      message: (error as Error).message || "网络请求失败",
      provider,
      retryable: true,
    } as AIError;
  }
}
