import * as fs from "fs";
import * as path from "path";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

import { cet4Words } from "../src/data/cet4Words";
import { PrismaClient } from "../src/generated/prisma/client";
import { stringifyJsonArray } from "../src/lib/json-array";
import "dotenv/config";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

interface SeedWord {
  word: string;
  phonetic?: string | null;
  meaning: string;
  partOfSpeech?: string | null;
  frequency?: number;
  example?: string | null;
  exampleCn?: string | null;
  tags?: string[];
}

function loadSeedWords(): SeedWord[] {
  const fullWordListPath = path.join(process.cwd(), "data", "cet4-words.json");
  if (fs.existsSync(fullWordListPath)) {
    return JSON.parse(fs.readFileSync(fullWordListPath, "utf-8")) as SeedWord[];
  }

  return cet4Words;
}

async function syncWords(words: SeedWord[]) {
  const batchSize = 50;
  let synced = 0;

  for (let i = 0; i < words.length; i += batchSize) {
    const batch = words.slice(i, i + batchSize);

    await prisma.$transaction(
      batch.map((w) =>
        prisma.word.upsert({
          where: { word: w.word.toLowerCase() },
          create: {
            word: w.word.toLowerCase(),
            phonetic: w.phonetic || null,
            meaning: w.meaning,
            partOfSpeech: w.partOfSpeech || null,
            level: "cet4",
            frequency: w.frequency || 1,
            example: w.example || null,
            exampleCn: w.exampleCn || null,
            tags: stringifyJsonArray(w.tags || []),
          },
          update: {
            phonetic: w.phonetic || null,
            meaning: w.meaning,
            partOfSpeech: w.partOfSpeech || null,
            level: "cet4",
            frequency: w.frequency || 1,
            example: w.example || null,
            exampleCn: w.exampleCn || null,
            tags: stringifyJsonArray(w.tags || []),
          },
        }),
      ),
    );

    synced += batch.length;
    console.log(`Synced ${synced}/${words.length} CET-4 words...`);
  }
}

async function main() {
  const seedWords = loadSeedWords();
  const existingCount = await prisma.word.count();
  if (existingCount > 0) {
    console.log(`Word table has ${existingCount} records. Syncing the full CET-4 list.`);
  }

  await syncWords(seedWords);

  const total = await prisma.word.count();
  console.log(`CET-4 word import complete. Total words: ${total}`);

  const testEmail = "test@cet4.com";
  const testPassword = "test123456";

  const existingUser = await prisma.user.findUnique({
    where: { email: testEmail },
  });

  if (existingUser) {
    console.log(`Test user already exists: ${testEmail}`);
  } else {
    const hashedPassword = await bcrypt.hash(testPassword, 12);

    await prisma.user.create({
      data: {
        email: testEmail,
        password: hashedPassword,
        name: "Test User",
        level: 1,
        totalWords: 0,
        masteredWords: 0,
        streak: 0,
        xp: 0,
      },
    });

    console.log(`Test user created: ${testEmail}`);
  }

  console.log(`Test account: ${testEmail} / ${testPassword}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
