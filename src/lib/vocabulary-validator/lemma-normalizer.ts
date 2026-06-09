import type { LemmaResult } from "./types";

const IRREGULAR_VERBS: Map<string, string> = new Map([
  ["was", "be"],
  ["were", "be"],
  ["been", "be"],
  ["being", "be"],
  ["had", "have"],
  ["has", "have"],
  ["having", "have"],
  ["did", "do"],
  ["does", "do"],
  ["done", "do"],
  ["doing", "do"],
  ["went", "go"],
  ["gone", "go"],
  ["goes", "go"],
  ["going", "go"],
  ["said", "say"],
  ["says", "say"],
  ["saying", "say"],
  ["made", "make"],
  ["makes", "make"],
  ["making", "make"],
  ["took", "take"],
  ["taken", "take"],
  ["takes", "take"],
  ["taking", "take"],
  ["came", "come"],
  ["comes", "come"],
  ["coming", "come"],
  ["saw", "see"],
  ["seen", "see"],
  ["sees", "see"],
  ["seeing", "see"],
  ["knew", "know"],
  ["known", "know"],
  ["knows", "know"],
  ["got", "get"],
  ["gotten", "get"],
  ["gets", "get"],
  ["getting", "get"],
  ["gave", "give"],
  ["given", "give"],
  ["gives", "give"],
  ["found", "find"],
  ["finds", "find"],
  ["finding", "find"],
  ["thought", "think"],
  ["thinks", "think"],
  ["thinking", "think"],
  ["told", "tell"],
  ["tells", "tell"],
  ["telling", "tell"],
  ["became", "become"],
  ["becomes", "become"],
  ["left", "leave"],
  ["leaves", "leave"],
  ["leaving", "leave"],
  ["felt", "feel"],
  ["feels", "feel"],
  ["feeling", "feel"],
  ["put", "put"],
  ["puts", "put"],
  ["putting", "put"],
  ["brought", "bring"],
  ["brings", "bring"],
  ["bringing", "bring"],
  ["began", "begin"],
  ["begun", "begin"],
  ["begins", "begin"],
  ["kept", "keep"],
  ["keeps", "keep"],
  ["keeping", "keep"],
  ["held", "hold"],
  ["holds", "hold"],
  ["holding", "hold"],
  ["wrote", "write"],
  ["written", "write"],
  ["writes", "write"],
  ["stood", "stand"],
  ["stands", "stand"],
  ["standing", "stand"],
  ["heard", "hear"],
  ["hears", "hear"],
  ["hearing", "hear"],
  ["let", "let"],
  ["lets", "let"],
  ["letting", "let"],
  ["meant", "mean"],
  ["means", "mean"],
  ["meaning", "mean"],
  ["set", "set"],
  ["sets", "set"],
  ["setting", "set"],
  ["met", "meet"],
  ["meets", "meet"],
  ["meeting", "meet"],
  ["ran", "run"],
  ["runs", "run"],
  ["running", "run"],
  ["paid", "pay"],
  ["pays", "pay"],
  ["paying", "pay"],
  ["sat", "sit"],
  ["sits", "sit"],
  ["sitting", "sit"],
  ["spoke", "speak"],
  ["spoken", "speak"],
  ["speaks", "speak"],
  ["lay", "lie"],
  ["lain", "lie"],
  ["lies", "lie"],
  ["lying", "lie"],
  ["led", "lead"],
  ["leads", "lead"],
  ["leading", "lead"],
  ["read", "read"],
  ["reads", "read"],
  ["reading", "read"],
  ["grew", "grow"],
  ["grown", "grow"],
  ["grows", "grow"],
  ["lost", "lose"],
  ["loses", "lose"],
  ["losing", "lose"],
  ["fell", "fall"],
  ["fallen", "fall"],
  ["falls", "fall"],
  ["sent", "send"],
  ["sends", "send"],
  ["sending", "send"],
  ["built", "build"],
  ["builds", "build"],
  ["building", "build"],
  ["spent", "spend"],
  ["spends", "spend"],
  ["spending", "spend"],
  ["broke", "break"],
  ["broken", "break"],
  ["breaks", "break"],
  ["drove", "drive"],
  ["driven", "drive"],
  ["drives", "drive"],
  ["bought", "buy"],
  ["buys", "buy"],
  ["buying", "buy"],
  ["ate", "eat"],
  ["eaten", "eat"],
  ["eats", "eat"],
  ["eating", "eat"],
  ["chose", "choose"],
  ["chosen", "choose"],
  ["chooses", "choose"],
  ["drew", "draw"],
  ["drawn", "draw"],
  ["draws", "draw"],
  ["flew", "fly"],
  ["flown", "fly"],
  ["flies", "fly"],
  ["forgot", "forget"],
  ["forgotten", "forget"],
  ["forgets", "forget"],
  ["froze", "freeze"],
  ["frozen", "freeze"],
  ["freezes", "freeze"],
  ["hit", "hit"],
  ["hits", "hit"],
  ["hitting", "hit"],
  ["hurt", "hurt"],
  ["hurts", "hurt"],
  ["hurting", "hurt"],
  ["rode", "ride"],
  ["ridden", "ride"],
  ["rides", "ride"],
  ["rang", "ring"],
  ["rung", "ring"],
  ["rings", "ring"],
  ["rose", "rise"],
  ["risen", "rise"],
  ["rises", "rise"],
  ["sang", "sing"],
  ["sung", "sing"],
  ["sings", "sing"],
  ["swam", "swim"],
  ["swum", "swim"],
  ["swims", "swim"],
  ["taught", "teach"],
  ["teaches", "teach"],
  ["threw", "throw"],
  ["thrown", "throw"],
  ["throws", "throw"],
  ["understood", "understand"],
  ["understands", "understand"],
  ["woke", "wake"],
  ["woken", "wake"],
  ["wakes", "wake"],
  ["wore", "wear"],
  ["worn", "wear"],
  ["wears", "wear"],
  ["won", "win"],
  ["wins", "win"],
  ["winning", "win"],
  ["showed", "show"],
  ["shown", "show"],
  ["shows", "show"],
]);

const IRREGULAR_PLURALS: Map<string, string> = new Map([
  ["children", "child"],
  ["men", "man"],
  ["women", "woman"],
  ["people", "person"],
  ["teeth", "tooth"],
  ["feet", "foot"],
  ["mice", "mouse"],
  ["geese", "goose"],
  ["oxen", "ox"],
  ["sheep", "sheep"],
  ["deer", "deer"],
  ["fish", "fish"],
  ["species", "species"],
  ["series", "series"],
]);

const IRREGULAR_COMPARATIVES: Map<string, string> = new Map([
  ["better", "good"],
  ["best", "good"],
  ["worse", "bad"],
  ["worst", "bad"],
  ["more", "much"],
  ["most", "much"],
  ["less", "little"],
  ["least", "little"],
  ["farther", "far"],
  ["farthest", "far"],
  ["further", "far"],
  ["furthest", "far"],
  ["older", "old"],
  ["oldest", "old"],
  ["elder", "old"],
  ["eldest", "old"],
]);

const SUFFIX_REPLACEMENTS: Array<{ suffix: string; replacement: string; minLength: number }> = [
  { suffix: "ies", replacement: "y", minLength: 5 },
  { suffix: "ives", replacement: "ife", minLength: 6 },
  { suffix: "ves", replacement: "f", minLength: 5 },
  { suffix: "sses", replacement: "ss", minLength: 6 },
  { suffix: "shes", replacement: "sh", minLength: 6 },
  { suffix: "ches", replacement: "ch", minLength: 6 },
  { suffix: "xes", replacement: "x", minLength: 5 },
  { suffix: "ses", replacement: "s", minLength: 5 },
  { suffix: "zes", replacement: "z", minLength: 5 },
  { suffix: "nning", replacement: "n", minLength: 7 },
  { suffix: "pping", replacement: "p", minLength: 7 },
  { suffix: "tting", replacement: "t", minLength: 7 },
  { suffix: "mming", replacement: "m", minLength: 7 },
  { suffix: "gging", replacement: "g", minLength: 7 },
  { suffix: "lling", replacement: "ll", minLength: 7 },
  { suffix: "ssing", replacement: "ss", minLength: 7 },
  { suffix: "ing", replacement: "", minLength: 5 },
  { suffix: "ied", replacement: "y", minLength: 5 },
  { suffix: "tted", replacement: "t", minLength: 6 },
  { suffix: "pped", replacement: "p", minLength: 6 },
  { suffix: "nned", replacement: "n", minLength: 6 },
  { suffix: "gged", replacement: "g", minLength: 6 },
  { suffix: "mmed", replacement: "m", minLength: 6 },
  { suffix: "ed", replacement: "", minLength: 4 },
  { suffix: "iest", replacement: "y", minLength: 6 },
  { suffix: "ier", replacement: "y", minLength: 5 },
  { suffix: "est", replacement: "", minLength: 5 },
  { suffix: "er", replacement: "", minLength: 4 },
  { suffix: "ment", replacement: "", minLength: 6 },
  { suffix: "ness", replacement: "", minLength: 6 },
  { suffix: "tion", replacement: "e", minLength: 6 },
  { suffix: "sion", replacement: "d", minLength: 6 },
  { suffix: "able", replacement: "", minLength: 6 },
  { suffix: "ible", replacement: "", minLength: 6 },
  { suffix: "ful", replacement: "", minLength: 5 },
  { suffix: "less", replacement: "", minLength: 6 },
  { suffix: "ly", replacement: "", minLength: 4 },
  { suffix: "ise", replacement: "", minLength: 5 },
  { suffix: "ize", replacement: "", minLength: 5 },
  { suffix: "s", replacement: "", minLength: 4 },
];

function normalizeDoubleConsonant(word: string): string {
  if (word.length >= 4) {
    const last = word[word.length - 1];
    const secondLast = word[word.length - 2];
    if (last === secondLast && "bcdfghjklmnpqrstvwxz".includes(last)) {
      return word.slice(0, -1);
    }
  }
  return word;
}

export function getLemma(word: string): string {
  const lower = word.toLowerCase().trim();
  if (lower.length < 3) return lower;

  const irregularVerb = IRREGULAR_VERBS.get(lower);
  if (irregularVerb) return irregularVerb;

  const irregularPlural = IRREGULAR_PLURALS.get(lower);
  if (irregularPlural) return irregularPlural;

  const irregularComp = IRREGULAR_COMPARATIVES.get(lower);
  if (irregularComp) return irregularComp;

  for (const rule of SUFFIX_REPLACEMENTS) {
    if (lower.endsWith(rule.suffix) && lower.length >= rule.minLength) {
      const stem = lower.slice(0, -rule.suffix.length);
      let lemma = stem + rule.replacement;

      lemma = normalizeDoubleConsonant(lemma);

      if (lemma.length >= 2) {
        return lemma;
      }
    }
  }

  return lower;
}

export function getLookupForms(word: string): string[] {
  const lower = word.toLowerCase().trim();
  const forms = new Set<string>([lower]);
  const lemma = getLemma(lower);
  forms.add(lemma);

  if (lower.endsWith("ing") && lower.length > 5) {
    forms.add(`${lower.slice(0, -3)}e`);
  }

  if (lower.endsWith("ed") && lower.length > 4) {
    forms.add(`${lower.slice(0, -1)}`);
  }

  return [...forms].filter((form) => form.length >= 2);
}

export function normalize(word: string): string {
  return getLemma(word);
}

export function batchNormalize(words: string[]): string[] {
  return words.map((w) => normalize(w));
}

export function analyzeWord(word: string): LemmaResult {
  const lemma = getLemma(word);
  const lower = word.toLowerCase().trim();

  return {
    original: lower,
    lemma,
    isBaseForm: lemma === lower,
    possibleForms: lemma !== lower ? [lemma, lower] : [lower],
  };
}

export function getWordRoot(word: string): string {
  return getLemma(word);
}
