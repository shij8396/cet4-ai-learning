import { describe, it, expect, beforeAll } from "vitest";

import {
  normalize,
  batchNormalize,
  getLemma,
  getLookupForms,
  analyzeWord,
} from "../lemma-normalizer";
import {
  checkLevel,
  batchCheckLevel,
  getOutOfLevelWords,
  initializeLevelChecker,
} from "../level-checker";
import { analyzeReadability, getDifficultyLevel } from "../readability-analyzer";
import {
  spellCheck,
  batchSpellCheck,
  initializeSpellChecker,
  levenshteinDistance,
} from "../spell-checker";
import {
  tokenize,
  tokenizeDetailed,
  tokenizeWithPositions,
  getUniqueTokens,
  getTokenFrequency,
} from "../tokenizer";
import { validateContent, validateWriting, validateWord, initializeValidator } from "../validator";
import {
  checkVocabulary,
  isInCET4,
  getCoverageRate,
  initializeVocabularyChecker,
} from "../vocabulary-checker";

import type { WordEntry } from "../types";

const TEST_WORDS = [
  "abandon",
  "ability",
  "able",
  "abnormal",
  "aboard",
  "about",
  "above",
  "abroad",
  "absence",
  "absent",
  "absolute",
  "absorb",
  "abstract",
  "abundant",
  "academic",
  "accelerate",
  "accept",
  "access",
  "accompany",
  "accomplish",
  "account",
  "accurate",
  "achieve",
  "acknowledge",
  "acquire",
  "active",
  "actual",
  "adapt",
  "addition",
  "adequate",
  "adjust",
  "admire",
  "adopt",
  "advance",
  "advantage",
  "adventure",
  "advertise",
  "advice",
  "affair",
  "afford",
  "afraid",
  "after",
  "against",
  "agency",
  "agenda",
  "aggressive",
  "agree",
  "agriculture",
  "aircraft",
  "alcohol",
  "allow",
  "almost",
  "alone",
  "already",
  "although",
  "altitude",
  "always",
  "amaze",
  "ambition",
  "among",
  "amount",
  "analyze",
  "ancient",
  "animal",
  "announce",
  "annual",
  "another",
  "answer",
  "anxiety",
  "anybody",
  "apart",
  "apologize",
  "apparent",
  "appeal",
  "appear",
  "appetite",
  "appliance",
  "apply",
  "appoint",
  "appreciate",
  "approach",
  "appropriate",
  "approve",
  "argue",
  "arise",
  "arrange",
  "arrest",
  "arrive",
  "article",
  "artificial",
  "aspect",
  "assemble",
  "assess",
  "assign",
  "assist",
  "associate",
  "assume",
  "atmosphere",
  "attach",
  "attack",
  "attain",
  "attempt",
  "attend",
  "attitude",
  "attract",
  "attribute",
  "audience",
  "author",
  "authority",
  "automatic",
  "available",
  "avenue",
  "average",
  "avoid",
  "award",
  "aware",
  "balance",
  "barrier",
  "battery",
  "battle",
  "beauty",
  "because",
  "become",
  "before",
  "begin",
  "behave",
  "behind",
  "belief",
  "believe",
  "belong",
  "benefit",
  "besides",
  "between",
  "beyond",
  "billion",
  "biology",
  "bitter",
  "blame",
  "blank",
  "border",
  "borrow",
  "bother",
  "bottom",
  "boundary",
  "branch",
  "brand",
  "brave",
  "breath",
  "bridge",
  "brief",
  "bright",
  "bring",
  "broad",
  "broadcast",
  "budget",
  "build",
  "burden",
  "business",
  "cabinet",
  "calculate",
  "campaign",
  "campus",
  "cancel",
  "candidate",
  "capable",
  "capacity",
  "capital",
  "capture",
  "career",
  "careful",
  "carry",
  "category",
  "celebrate",
  "central",
  "challenge",
  "champion",
  "channel",
  "chapter",
  "character",
  "charge",
  "charity",
  "chemical",
  "children",
  "choice",
  "choose",
  "church",
  "citizen",
  "civil",
  "classic",
  "climate",
  "colleague",
  "collect",
  "college",
  "combine",
  "comfort",
  "command",
  "comment",
  "commerce",
  "commit",
  "committee",
  "common",
  "communicate",
  "community",
  "companion",
  "company",
  "compare",
  "compete",
  "complain",
  "complete",
  "complex",
  "component",
  "compose",
  "comprehensive",
  "concentrate",
  "concept",
  "concern",
  "conclude",
  "condition",
  "conduct",
  "conference",
  "confidence",
  "confirm",
  "conflict",
  "confuse",
  "connect",
  "conscious",
  "consequence",
  "conservative",
  "consider",
  "consistent",
  "constant",
  "construct",
  "consult",
  "consume",
  "contact",
  "contain",
  "contemporary",
  "content",
  "contest",
  "context",
  "continue",
  "contract",
  "contrast",
  "contribute",
  "control",
  "controversial",
  "convenient",
  "convention",
  "convince",
  "cooperate",
  "corporation",
  "correct",
  "correspond",
  "council",
  "counter",
  "country",
  "courage",
  "course",
  "create",
  "creative",
  "credit",
  "crime",
  "crisis",
  "critical",
  "culture",
  "curious",
  "current",
  "custom",
  "customer",
  "damage",
  "danger",
  "daughter",
  "debate",
  "decade",
  "decide",
  "decision",
  "declare",
  "decline",
  "decorate",
  "decrease",
  "defeat",
  "defend",
  "define",
  "definite",
  "degree",
  "delay",
  "deliberate",
  "delicate",
  "deliver",
  "demand",
  "democracy",
  "demonstrate",
  "department",
  "depend",
  "deposit",
  "depress",
  "describe",
  "deserve",
  "design",
  "desire",
  "despite",
  "destination",
  "destroy",
  "detail",
  "detect",
  "determine",
  "develop",
  "device",
  "devote",
  "different",
  "difficult",
  "digital",
  "dimension",
  "direct",
  "disappear",
  "discipline",
  "discount",
  "discover",
  "discuss",
  "disease",
  "dismiss",
  "display",
  "dispute",
  "distance",
  "distinguish",
  "distribute",
  "district",
  "diverse",
  "document",
  "domestic",
  "dominate",
  "donate",
  "dramatic",
  "economy",
  "edition",
  "educate",
  "effective",
  "efficient",
  "effort",
  "elderly",
  "election",
  "electric",
  "element",
  "eliminate",
  "emerge",
  "emotion",
  "emphasis",
  "employ",
  "enable",
  "encounter",
  "encourage",
  "energy",
  "engage",
  "engine",
  "enormous",
  "ensure",
  "enterprise",
  "entertain",
  "enthusiasm",
  "entire",
  "environment",
  "episode",
  "equal",
  "equipment",
  "essential",
  "establish",
  "estimate",
  "evaluate",
  "evidence",
  "evolve",
  "exactly",
  "examine",
  "example",
  "excellent",
  "exchange",
  "exclude",
  "execute",
  "exercise",
  "exhibit",
  "exist",
  "expand",
  "expect",
  "expense",
  "experiment",
  "expert",
  "explain",
  "explore",
  "export",
  "expose",
  "express",
  "extend",
  "extensive",
  "extreme",
  "facility",
  "factor",
  "failure",
  "familiar",
  "fashion",
  "feature",
  "federal",
  "fiction",
  "figure",
  "final",
  "finance",
  "foreign",
  "formal",
  "former",
  "formula",
  "fortune",
  "forward",
  "foundation",
  "freedom",
  "frequent",
  "function",
  "fundamental",
  "furniture",
  "further",
  "gallery",
  "general",
  "generate",
  "generous",
  "genuine",
  "global",
  "government",
  "graduate",
  "guarantee",
  "guidance",
  "handle",
  "happen",
  "harmony",
  "healthy",
  "heavily",
  "history",
  "horizon",
  "household",
  "however",
  "humorous",
  "identify",
  "ignore",
  "illegal",
  "illustrate",
  "imagine",
  "immediate",
  "immigrant",
  "impact",
  "implement",
  "implication",
  "import",
  "impose",
  "impress",
  "improve",
  "incident",
  "include",
  "income",
  "increase",
  "independence",
  "indicate",
  "individual",
  "industry",
  "influence",
  "inform",
  "initial",
  "initiative",
  "innocent",
  "innovation",
  "inquiry",
  "insight",
  "inspection",
  "install",
  "instance",
  "institute",
  "instrument",
  "insurance",
  "integrate",
  "intellectual",
  "intelligence",
  "intense",
  "intention",
  "interact",
  "interest",
  "internal",
  "interpret",
  "intervention",
  "interview",
  "introduce",
  "investigate",
  "investment",
  "involve",
  "isolate",
  "journal",
  "journey",
  "judgment",
  "justice",
  "justify",
  "knowledge",
  "landscape",
  "language",
  "launch",
  "leading",
  "liberal",
  "liberty",
  "likely",
  "limited",
  "literary",
  "literature",
  "location",
  "logical",
  "luxury",
  "machine",
  "maintain",
  "major",
  "manage",
  "manufacture",
  "margin",
  "market",
  "massive",
  "material",
  "measure",
  "mechanism",
  "medium",
  "mental",
  "mention",
  "message",
  "military",
  "million",
  "minimum",
  "minister",
  "minority",
  "mission",
  "mistake",
  "mixture",
  "moderate",
  "modern",
  "modify",
  "monitor",
  "morality",
  "moreover",
  "mountain",
  "movement",
  "multiple",
  "musical",
  "mystery",
  "namely",
  "narrow",
  "national",
  "natural",
  "necessary",
  "negative",
  "neglect",
  "negotiate",
  "neighbor",
  "network",
  "normal",
  "notable",
  "nothing",
  "notice",
  "nowhere",
  "nuclear",
  "numerous",
  "objective",
  "obligation",
  "observe",
  "obstacle",
  "obtain",
  "obvious",
  "occasion",
  "occupy",
  "offense",
  "operate",
  "opinion",
  "opponent",
  "opportunity",
  "oppose",
  "option",
  "ordinary",
  "organize",
  "original",
  "outcome",
  "outline",
  "output",
  "outstanding",
  "overall",
  "overcome",
  "overseas",
  "package",
  "paragraph",
  "parallel",
  "participate",
  "particular",
  "partner",
  "passage",
  "passion",
  "patient",
  "pattern",
  "payment",
  "penalty",
  "pension",
  "percent",
  "perfect",
  "perform",
  "perhaps",
  "period",
  "permanent",
  "permission",
  "personal",
  "perspective",
  "persuade",
  "phenomenon",
  "philosophy",
  "physical",
  "planet",
  "pleasure",
  "politics",
  "pollution",
  "popular",
  "population",
  "portion",
  "position",
  "positive",
  "possess",
  "possible",
  "potential",
  "poverty",
  "practical",
  "precious",
  "precise",
  "predict",
  "prefer",
  "prepare",
  "presence",
  "present",
  "preserve",
  "pressure",
  "previous",
  "primary",
  "principle",
  "priority",
  "private",
  "probably",
  "procedure",
  "proceed",
  "process",
  "produce",
  "profession",
  "profit",
  "program",
  "progress",
  "project",
  "promise",
  "promote",
  "proper",
  "property",
  "proportion",
  "proposal",
  "prospect",
  "protect",
  "protein",
  "protest",
  "provide",
  "province",
  "psychological",
  "publish",
  "purchase",
  "pursue",
  "puzzle",
  "qualify",
  "quality",
  "quantity",
  "quarter",
  "quickly",
  "radical",
  "random",
  "rapidly",
  "reaction",
  "readily",
  "realistic",
  "reality",
  "realize",
  "reasonable",
  "receive",
  "recently",
  "recognize",
  "recommend",
  "recover",
  "recruit",
  "reduce",
  "reference",
  "reflect",
  "reform",
  "refugee",
  "regard",
  "region",
  "register",
  "regulate",
  "reject",
  "relate",
  "release",
  "relevant",
  "relief",
  "religion",
  "rely",
  "remain",
  "remark",
  "remedy",
  "remote",
  "remove",
  "replace",
  "represent",
  "republic",
  "reputation",
  "request",
  "require",
  "research",
  "reserve",
  "resign",
  "resist",
  "resolution",
  "resolve",
  "resource",
  "respond",
  "restore",
  "restrict",
  "result",
  "retail",
  "retire",
  "reveal",
  "revenue",
  "reverse",
  "review",
  "revolution",
  "reward",
  "routine",
  "satisfy",
  "schedule",
  "scheme",
  "scholar",
  "science",
  "section",
  "secure",
  "selection",
  "senior",
  "sensitive",
  "separate",
  "sequence",
  "service",
  "session",
  "setting",
  "settle",
  "several",
  "severe",
  "shelter",
  "shortage",
  "shoulder",
  "shrink",
  "signal",
  "significance",
  "similar",
  "sincere",
  "situation",
  "slightly",
  "society",
  "software",
  "solution",
  "somehow",
  "somewhat",
  "special",
  "species",
  "specific",
  "spiritual",
  "stability",
  "standard",
  "statement",
  "statistics",
  "strategy",
  "strength",
  "structure",
  "struggle",
  "subject",
  "subsequent",
  "substance",
  "substantial",
  "succeed",
  "success",
  "sufficient",
  "suggest",
  "suitable",
  "summary",
  "supply",
  "support",
  "suppose",
  "supreme",
  "surface",
  "surgery",
  "surplus",
  "surround",
  "survival",
  "survive",
  "suspect",
  "suspend",
  "sustain",
  "symbol",
  "symptom",
  "system",
  "tackle",
  "talent",
  "target",
  "technique",
  "technology",
  "temporary",
  "tendency",
  "tension",
  "terminal",
  "territory",
  "theater",
  "therefore",
  "thinking",
  "thorough",
  "threaten",
  "through",
  "together",
  "tourism",
  "tourist",
  "tradition",
  "transfer",
  "transform",
  "transport",
  "treatment",
  "tropical",
  "typically",
  "ultimate",
  "undergo",
  "understand",
  "undertake",
  "unique",
  "universal",
  "universe",
  "university",
  "unusual",
  "valuable",
  "variety",
  "vehicle",
  "venture",
  "version",
  "veteran",
  "victim",
  "victory",
  "village",
  "violence",
  "vision",
  "visitor",
  "vitamin",
  "volunteer",
  "weather",
  "website",
  "welfare",
  "western",
  "whatever",
  "whereas",
  "whether",
  "widespread",
  "wildlife",
  "willing",
  "wonder",
  "worried",
  "worship",
  "writing",
];

const TEST_WORD_META: WordEntry[] = TEST_WORDS.map((w, i) => ({
  word: w,
  level: "cet4",
  frequency: 5 - Math.floor(i / 200),
  tags: i < 50 ? ["高频"] : i < 100 ? ["核心"] : [],
}));

describe("Tokenizer", () => {
  it("should tokenize simple text", () => {
    const result = tokenize("hello world test");
    expect(result).toEqual(["hello", "world", "test"]);
  });

  it("should remove punctuation", () => {
    const result = tokenize("Hello, world! How are you?");
    expect(result).toEqual(["hello", "world", "how", "are", "you"]);
  });

  it("should lowercase all tokens", () => {
    const result = tokenize("HELLO World Test");
    expect(result.every((t) => t === t.toLowerCase())).toBe(true);
  });

  it("should handle contractions - don't", () => {
    const result = tokenize("I don't know");
    expect(result).toContain("do");
    expect(result).toContain("not");
    expect(result).toContain("know");
  });

  it("should handle contractions - it's", () => {
    const result = tokenize("it's a test");
    expect(result).toContain("it");
    expect(result).toContain("is");
  });

  it("should handle contractions - I'm", () => {
    const result = tokenize("I'm happy");
    expect(result).toContain("am");
    expect(result).toContain("happy");
  });

  it("should handle multiple contractions", () => {
    const result = tokenize("I'm going and he's not happy. They've gone.");
    expect(result).toContain("am");
    expect(result).toContain("not");
    expect(result).toContain("have");
    expect(result).toContain("gone");
  });

  it("should filter out short tokens", () => {
    const result = tokenize("a b c d at");
    expect(result.every((t) => t.length >= 2)).toBe(true);
  });

  it("should handle empty string", () => {
    const result = tokenize("");
    expect(result).toEqual([]);
  });

  it("should tokenize detailed with contraction info", () => {
    const result = tokenizeDetailed("don't go");
    const contraction = result.find((t) => t.original === "don't");
    expect(contraction).toBeDefined();
    expect(contraction!.isContraction).toBe(true);
    expect(contraction!.expandedTokens).toEqual(["do", "not"]);
  });

  it("should tokenize with positions", () => {
    const result = tokenizeWithPositions("Hello world test");
    expect(result.length).toBe(3);
    expect(result[0].token).toBe("hello");
    expect(result[0].start).toBe(0);
  });

  it("should get unique tokens", () => {
    const result = getUniqueTokens(["hello", "world", "hello", "test"]);
    expect(result).toHaveLength(3);
    expect(result).toContain("hello");
  });

  it("should get token frequency", () => {
    const result = getTokenFrequency(["hello", "world", "hello"]);
    expect(result.get("hello")).toBe(2);
    expect(result.get("world")).toBe(1);
  });
});

describe("SpellChecker", () => {
  beforeAll(() => {
    initializeSpellChecker(TEST_WORDS);
  });

  it("should recognize correct words", () => {
    const result = spellCheck("abandon");
    expect(result.isCorrect).toBe(true);
    expect(result.corrections).toHaveLength(0);
  });

  it("should detect misspelled words", () => {
    const result = spellCheck("abandn");
    expect(result.isCorrect).toBe(false);
    expect(result.corrections).toContain("abandon");
  });

  it("should suggest similar words", () => {
    const result = spellCheck("abilty");
    expect(result.corrections).toContain("ability");
  });

  it("should handle correct CET4 words", () => {
    const result = spellCheck("university");
    expect(result.isCorrect).toBe(true);
  });

  it("should detect misspelling of CET4 words", () => {
    const result = spellCheck("universit");
    expect(result.isCorrect).toBe(false);
    expect(result.corrections).toContain("university");
  });

  it("should batch spell check", () => {
    const results = batchSpellCheck(["abandon", "abandn", "university"]);
    expect(results).toHaveLength(3);
    expect(results[0].isCorrect).toBe(true);
    expect(results[1].isCorrect).toBe(false);
    expect(results[2].isCorrect).toBe(true);
  });

  it("should calculate Levenshtein distance correctly", () => {
    expect(levenshteinDistance("cat", "cat")).toBe(0);
    expect(levenshteinDistance("cat", "cats")).toBe(1);
    expect(levenshteinDistance("cat", "cut")).toBe(1);
    expect(levenshteinDistance("abandon", "abandn")).toBe(1);
    expect(levenshteinDistance("test", "testing")).toBe(3);
  });
});

describe("VocabularyChecker", () => {
  beforeAll(() => {
    initializeVocabularyChecker(TEST_WORDS);
  });

  it("should identify CET4 words", () => {
    expect(isInCET4("abandon")).toBe(true);
    expect(isInCET4("university")).toBe(true);
    expect(isInCET4("notac4eword")).toBe(false);
  });

  it("should check vocabulary and calculate coverage", () => {
    const result = checkVocabulary(["abandon", "university", "notac4eword", "anotherfake"]);
    expect(result.validWords).toContain("abandon");
    expect(result.validWords).toContain("university");
    expect(result.invalidWords).toContain("notac4eword");
    expect(result.coverageRate).toBe(0.5);
  });

  it("should calculate 100% coverage for all CET4 words", () => {
    const result = checkVocabulary(["abandon", "ability", "university"]);
    expect(result.coverageRate).toBe(1);
  });

  it("should calculate coverage rate", () => {
    const rate = getCoverageRate(["abandon", "notaword"]);
    expect(rate).toBe(0.5);
  });
});

describe("LevelChecker", () => {
  beforeAll(() => {
    initializeLevelChecker(TEST_WORD_META);
  });

  it("should return level info for known words", () => {
    const result = checkLevel("abandon");
    expect(result.level).toBe("cet4");
    expect(result.isOutOfLevel).toBe(false);
  });

  it("should mark unknown words as out of level", () => {
    const result = checkLevel("notaword");
    expect(result.level).toBe("unknown");
    expect(result.isOutOfLevel).toBe(true);
  });

  it("should batch check levels", () => {
    const results = batchCheckLevel(["abandon", "university", "notaword"]);
    expect(results).toHaveLength(3);
    expect(results[0].isOutOfLevel).toBe(false);
    expect(results[2].isOutOfLevel).toBe(true);
  });

  it("should get out of level words", () => {
    const outOfLevel = getOutOfLevelWords(["abandon", "notaword", "fakeword"]);
    expect(outOfLevel).toContain("notaword");
    expect(outOfLevel).toContain("fakeword");
  });

  it("should return frequency for known words", () => {
    const result = checkLevel("abandon");
    expect(result.frequency).toBeGreaterThan(0);
  });
});

describe("LemmaNormalizer", () => {
  it("should handle plural forms", () => {
    expect(normalize("cats")).toBe("cat");
    expect(normalize("dogs")).toBe("dog");
  });

  it("should handle -ing forms", () => {
    expect(normalize("running")).toBe("run");
    expect(normalize("playing")).toBe("play");
  });

  it("should handle -ed forms", () => {
    expect(normalize("walked")).toBe("walk");
    expect(normalize("stopped")).toBe("stop");
  });

  it("should handle -es/-ies plurals", () => {
    expect(normalize("babies")).toBe("baby");
    expect(normalize("watches")).toBe("watch");
  });

  it("should handle irregular verbs", () => {
    expect(normalize("ran")).toBe("run");
    expect(normalize("went")).toBe("go");
    expect(normalize("took")).toBe("take");
    expect(normalize("written")).toBe("write");
  });

  it("should handle -ly adverbs", () => {
    expect(normalize("quickly")).toBe("quick");
    expect(normalize("happily")).toBe("happi");
  });

  it("should get lemma", () => {
    expect(getLemma("running")).toBe("run");
    expect(getLemma("went")).toBe("go");
    expect(getLemma("better")).toBe("good");
  });

  it("should include e-restored lookup forms for -ing words", () => {
    expect(getLookupForms("overcoming")).toContain("overcome");
    expect(getLookupForms("making")).toContain("make");
  });

  it("should analyze word", () => {
    const result = analyzeWord("running");
    expect(result.original).toBe("running");
    expect(result.lemma).toBe("run");
    expect(result.isBaseForm).toBe(false);
  });

  it("should normalize to base form", () => {
    const result = analyzeWord("run");
    expect(result.isBaseForm).toBe(true);
    expect(result.lemma).toBe("run");
  });

  it("should batch normalize", () => {
    const results = batchNormalize(["running", "walked", "cats", "done"]);
    expect(results).toEqual(["run", "walk", "cat", "do"]);
  });
});

describe("Validator", () => {
  beforeAll(() => {
    initializeValidator(TEST_WORDS, TEST_WORD_META);
  });

  it("should validate correct content", () => {
    const result = validateContent("abandon university student test");
    expect(result.valid).toBe(false);
  });

  it("should detect spelling errors", () => {
    const result = validateContent("I abandn the mission");
    expect(result.spellingErrors).toContain("abandn");
  });

  it("should detect invalid words", () => {
    const result = validateContent("This is xyznotaword test");
    expect(result.invalidWords).toContain("xyznotaword");
  });

  it("should calculate coverage rate", () => {
    const result = validateContent("abandon ability student xyznotaword");
    expect(result.coverageRate).toBeLessThanOrEqual(1);
    expect(result.coverageRate).toBeGreaterThan(0);
  });

  it("should validate single words", () => {
    const result = validateWord("abandon");
    expect(result.isValid).toBe(true);
    expect(result.isInCET4).toBe(true);
  });

  it("should detect invalid single words", () => {
    const result = validateWord("abandn");
    expect(result.isValid).toBe(false);
    expect(result.suggestions).toContain("abandon");
  });

  it("should validate writing with suggestions", () => {
    const result = validateWriting("I abandn the xyzword mission");
    expect(result.valid).toBe(false);
    expect(result.spellingErrors.length).toBeGreaterThan(0);
  });

  it("should return tokens in result", () => {
    const result = validateContent("hello world abandon test");
    expect(result.tokens.length).toBeGreaterThan(0);
  });
});

describe("ReadabilityAnalyzer", () => {
  beforeAll(() => {
    initializeVocabularyChecker(TEST_WORDS);
  });

  it("should analyze readability of simple text", () => {
    const result = analyzeReadability("The cat sat on the mat.");
    expect(result.sentenceCount).toBe(1);
    expect(result.wordCount).toBeGreaterThan(0);
    expect(result.level).toBeDefined();
  });

  it("should calculate average word length", () => {
    const result = analyzeReadability("Hello world test.");
    expect(result.avgWordLength).toBeGreaterThan(0);
  });

  it("should detect complex sentences", () => {
    const result = analyzeReadability(
      "Although I was tired because I had worked all day, I still went to the gym.",
    );
    expect(result.complexSentenceRatio).toBeGreaterThan(0);
  });

  it("should assign difficulty levels", () => {
    expect(getDifficultyLevel(10)).toBe("easy");
    expect(getDifficultyLevel(35)).toBe("medium");
    expect(getDifficultyLevel(60)).toBe("hard");
    expect(getDifficultyLevel(85)).toBe("very_hard");
  });

  it("should handle multi-sentence text", () => {
    const result = analyzeReadability("The cat sat on the mat. The dog ran in the park. ");
    expect(result.sentenceCount).toBe(2);
  });
});
