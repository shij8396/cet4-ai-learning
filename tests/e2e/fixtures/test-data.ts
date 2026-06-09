export const TEST_USER = {
  email: "e2e-test@cet4.com",
  password: "E2eTest123!",
  name: "E2E Tester",
};

export const TEST_USER_WRONG_PASSWORD = {
  email: "e2e-test@cet4.com",
  password: "WrongPassword1!",
};

export const TEST_REGISTER_USER = {
  name: "New Test User",
  email: `e2e-register-${Date.now()}@cet4.com`,
  password: "Register123!",
  confirmPassword: "Register123!",
};

export const INVALID_EMAILS = ["notanemail", "missing@", "@nodomain", "spaces in@email.com", ""];

export const WEAK_PASSWORDS = ["12345", "abc", "short"];

export const CET4_WORDS = [
  { english: "abandon", chinese: "放弃" },
  { english: "ability", chinese: "能力" },
  { english: "absence", chinese: "缺席" },
];

export const BEYOND_CET4_WORDS = ["sophisticated", "meticulous", "ubiquitous", "ephemeral"];

export const SPELLING_MISTAKES = [
  { wrong: "abandn", correct: "abandon" },
  { wrong: "abillity", correct: "ability" },
  { wrong: "absense", correct: "absence" },
  { wrong: "accomodate", correct: "accommodate" },
];

export const READING_LEVELS = ["beginner", "intermediate", "advanced"];

export const WRITING_PROMPTS = {
  short: "My favorite hobby",
  long: "Describe your most memorable travel experience in detail, including where you went, who you went with, what you did, and why it was memorable. Write at least 150 words.",
};
