export const CET4_SYSTEM_PROMPT = `You are an English learning assistant for CET4 (College English Test Band 4) students. 

CRITICAL RULES - YOU MUST FOLLOW:
1. ONLY use vocabulary from the CET4 word list. NEVER use words outside CET4 level.
2. CET4 words are basic/intermediate English words. Examples: important, develop, experience, knowledge, environment, society, technology, opportunity, comfortable, necessary, different, beautiful, difficult, possible, understand, remember, practice, achieve, improve.
3. NEVER use advanced words like: sophisticated, phenomenon, ubiquitous, paradigm, ameliorate, exacerbate, quintessential, multifaceted, juxtaposition, dichotomy, plethora, myriad.
4. Keep sentences SHORT and SIMPLE. Maximum 20 words per sentence.
5. Use SIMPLE grammar: present tense, past tense, simple clauses.
6. NO passive voice unless absolutely necessary.
7. Keep vocabulary difficulty at a level suitable for Chinese college students learning English.
8. Always include Chinese translations when generating example sentences.`;

export function buildSentencePrompt(params: {
  word: string;
  level?: number;
  topic?: string;
}): string {
  const { word, topic } = params;
  let prompt = `Generate 3 simple English sentences using the word "${word}". 

Requirements:
- Use ONLY CET4-level vocabulary
- Keep sentences short (8-15 words)
- Use simple grammar
- Make sentences natural and useful for daily communication
- Include Chinese translation for each sentence

`;
  if (topic) {
    prompt += `Topic context: ${topic}\n`;
  }
  prompt += `
Return format (JSON array):
[
  { "english": "...", "chinese": "...", "words": ["word1", "word2"] }
]`;

  return prompt;
}

export function buildReadingPrompt(params: {
  level?: number;
  topic?: string;
  wordCount?: number;
  newWordRatio?: number;
  knownWords?: string[];
}): string {
  const {
    level = 1,
    topic = "daily life",
    wordCount = 150,
    newWordRatio = 0.1,
    knownWords = [],
  } = params;

  return `Generate a short English reading article for CET4 learners.

Requirements:
- Topic: ${topic}
- About ${wordCount} words
- Difficulty level: ${level}/5
- Use ONLY CET4-level vocabulary
- New word ratio: about ${newWordRatio * 100}% (words the student may not know)
- Keep sentences short (10-18 words each)
- Use simple grammar structures
- Make it engaging and educational
${knownWords.length > 0 ? `- Try to include these known words: ${knownWords.slice(0, 20).join(", ")}` : ""}

Return format (JSON):
{
  "title": "Article title",
  "content": "Full article text with paragraphs separated by \\n\\n",
  "wordCount": number,
  "newWords": ["word1", "word2"],
  "level": number
}`;
}

export function buildQuestionPrompt(params: {
  articleTitle: string;
  articleContent: string;
  questionCount?: number;
}): string {
  const { articleTitle, articleContent, questionCount = 3 } = params;

  return `Based on the following reading article, generate ${questionCount} comprehension questions for CET4 learners.

Article title: ${articleTitle}
Article content:
${articleContent.slice(0, 1500)}

Requirements:
- Use ONLY CET4-level vocabulary in questions and options
- Include at least 1 multiple-choice and 1 true/false question
- Keep questions simple and direct
- Provide clear answers with short explanations

Return format (JSON array):
[
  {
    "id": "q1",
    "type": "choice",
    "question": "Question text",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "answer": "A",
    "explanation": "Why this is correct"
  }
]`;
}

export function buildWritingCoachPrompt(params: {
  originalText: string;
  mode: "expression" | "replacement" | "structure" | "simplify";
}): string {
  const { originalText, mode } = params;

  const modeInstructions: Record<string, string> = {
    expression:
      "Suggest simpler expressions using CET4 vocabulary. Recommend natural and simple ways to express the same idea.",
    replacement: "Identify words that are above CET4 level and suggest CET4-level replacements.",
    structure: "Suggest simpler sentence structures. Break long sentences into shorter ones.",
    simplify:
      "Rewrite the text using only CET4 vocabulary and simple grammar. Make it easier to understand.",
  };

  return `You are helping a CET4 student improve their English writing.

Current text:
"""
${originalText}
"""

Task: ${modeInstructions[mode] || modeInstructions.simplify}

CRITICAL: Only use CET4-level vocabulary. Never suggest words above CET4 level.

Return format (JSON array):
[
  {
    "type": "${mode}",
    "original": "original text segment",
    "suggested": "improved text segment",
    "explanation": "brief explanation in Chinese"
  }
]`;
}

export function buildRecommendationPrompt(params: {
  userLevel: number;
  masteredWords: number;
  weakWords: string[];
  recentTopics: string[];
  readingSpeed: number;
  writingScore: number | null;
}): string {
  const { userLevel, masteredWords, weakWords, recentTopics, readingSpeed, writingScore } = params;

  return `Based on the following student profile, recommend the best learning activities:

Student Profile:
- CET4 Level: ${userLevel}/5
- Mastered words: ${masteredWords}
- Weak words: ${weakWords.slice(0, 10).join(", ") || "none"}
- Recent topics: ${recentTopics.join(", ") || "none"}
- Reading speed: ${readingSpeed > 0 ? readingSpeed + " words/minute" : "unknown"}
- Writing score: ${writingScore != null ? writingScore + "/100" : "not yet assessed"}

Recommend:
1. Best topic areas to study next
2. Learning focus priorities
3. Suggested difficulty level

Return format (JSON):
{
  "focusAreas": ["area1", "area2"],
  "difficulty": number,
  "reason": "explanation in Chinese"
}`;
}

export function buildStudyPlanPrompt(params: {
  userLevel: number;
  masteredWords: number;
  totalCET4Words: number;
  weeklyGoal: number;
  availableMinutesPerDay: number;
  weakAreas: string[];
}): string {
  const {
    userLevel,
    masteredWords,
    totalCET4Words,
    weeklyGoal,
    availableMinutesPerDay,
    weakAreas,
  } = params;

  return `Create a daily study plan for a CET4 English learner.

Profile:
- Level: ${userLevel}/5
- Mastered: ${masteredWords}/${totalCET4Words} words
- Weekly goal: ${weeklyGoal} words
- Available time: ${availableMinutesPerDay} minutes/day
- Weak areas: ${weakAreas.join(", ") || "none"}

Create a realistic daily plan that includes:
- Words to learn
- Words to review
- Reading task
- Dictation task
- Writing task

Return format (JSON):
{
  "wordsToLearn": number,
  "wordsToReview": number,
  "readingTask": { "title": "suggested topic", "estimatedTime": minutes },
  "dictationTask": { "wordCount": number, "estimatedTime": minutes },
  "writingTask": { "topic": "suggested topic", "wordTarget": number, "estimatedTime": minutes },
  "totalEstimatedTime": minutes,
  "tips": ["tip1 in Chinese", "tip2 in Chinese"]
}`;
}

export function buildWeaknessAnalysisPrompt(params: {
  wrongWords: Array<{ word: string; count: number }>;
  mistakeTypes: Array<{ type: string; count: number }>;
  totalAttempts: number;
}): string {
  const { wrongWords, mistakeTypes, totalAttempts } = params;

  return `Analyze the following CET4 learner's error data and provide improvement suggestions.

Error Data:
- Total attempts: ${totalAttempts}
- Most common wrong words: ${
    wrongWords
      .slice(0, 10)
      .map((w) => `${w.word}(${w.count} times)`)
      .join(", ") || "none"
  }
- Mistake types: ${mistakeTypes.map((m) => `${m.type}(${m.count} times)`).join(", ") || "none"}

Analyze:
1. Patterns in errors
2. Root causes
3. Recommended exercises

Return format (JSON):
{
  "commonMistakeTypes": [{"type": "spelling", "count": number}],
  "suggestedExercises": ["exercise1 in Chinese", "exercise2 in Chinese"],
  "improvementAreas": ["area1 in Chinese", "area2 in Chinese"]
}`;
}
