import * as fs from "fs";
import * as path from "path";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { stringifyJsonArray } from "../src/lib/json-array";

import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

interface WordRow {
  word: string;
  phonetic?: string;
  meaning: string;
  partOfSpeech?: string;
  frequency?: number;
  example?: string;
  exampleCn?: string;
  tags?: string[];
}

function readJsonFile(filePath: string): WordRow[] {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as WordRow[];
}

function readCsvFile(filePath: string): WordRow[] {
  const raw = fs.readFileSync(filePath, "utf-8");
  const lines = raw.split("\n").filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((header) => header.trim());
  const rows: WordRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((value) => value.trim());
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });

    rows.push({
      word: row.word || "",
      phonetic: row.phonetic || undefined,
      meaning: row.meaning || row.definition || "",
      partOfSpeech: row.partOfSpeech || row.pos || undefined,
      frequency: row.frequency ? Number.parseInt(row.frequency, 10) : 1,
      example: row.example || undefined,
      exampleCn: row.exampleCn || row.example_cn || undefined,
      tags: row.tags ? row.tags.split(";") : [],
    });
  }

  return rows;
}

function validateWord(row: WordRow): string[] {
  const errors: string[] = [];

  if (!row.word || !/^[a-zA-Z]+(-[a-zA-Z]+)*$/.test(row.word)) {
    errors.push(`无效单词: "${row.word}"`);
  }

  if (!row.meaning || row.meaning.length < 2) {
    errors.push(`释义过短: "${row.meaning}"`);
  }

  return errors;
}

async function importWords(
  words: WordRow[],
): Promise<{ imported: number; updated: number; skipped: number; errors: number }> {
  let imported = 0;
  let updated = 0;
  const skipped = 0;
  let errors = 0;

  for (const row of words) {
    const validationErrors = validateWord(row);

    if (validationErrors.length > 0) {
      console.warn(`  跳过 "${row.word}": ${validationErrors.join(", ")}`);
      errors++;
      continue;
    }

    const existing = await prisma.word.findUnique({
      where: { word: row.word.toLowerCase() },
    });

    if (existing) {
      await prisma.word.update({
        where: { id: existing.id },
        data: {
          phonetic: row.phonetic ?? existing.phonetic,
          meaning: row.meaning,
          partOfSpeech: row.partOfSpeech ?? existing.partOfSpeech,
          level: "cet4",
          frequency: row.frequency ?? existing.frequency,
          example: row.example ?? existing.example,
          exampleCn: row.exampleCn ?? existing.exampleCn,
          tags: stringifyJsonArray(row.tags || []),
        },
      });
      updated++;
      continue;
    }

    await prisma.word.create({
      data: {
        word: row.word.toLowerCase(),
        phonetic: row.phonetic,
        meaning: row.meaning,
        partOfSpeech: row.partOfSpeech,
        level: "cet4",
        frequency: row.frequency || 1,
        example: row.example,
        exampleCn: row.exampleCn,
        tags: stringifyJsonArray(row.tags || []),
      },
    });
    imported++;
  }

  return { imported, updated, skipped, errors };
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("用法: npx tsx scripts/import-cet4.ts <file.json|file.csv>");
    console.log("示例: npx tsx scripts/import-cet4.ts data/cet4-words.json");
    process.exit(0);
  }

  const filePath = path.resolve(args[0]);

  if (!fs.existsSync(filePath)) {
    console.error(`文件不存在: ${filePath}`);
    process.exit(1);
  }

  console.log(`读取文件: ${filePath}`);

  const ext = path.extname(filePath).toLowerCase();
  let words: WordRow[];

  try {
    if (ext === ".json") {
      words = readJsonFile(filePath);
    } else if (ext === ".csv") {
      words = readCsvFile(filePath);
    } else {
      console.error("不支持的文件格式，请使用 .json 或 .csv");
      process.exit(1);
    }
  } catch (err) {
    console.error("文件解析失败:", err);
    process.exit(1);
  }

  console.log(`读取到 ${words.length} 条单词记录`);

  const uniqueWords = words.filter(
    (word, index, allWords) =>
      allWords.findIndex(
        (candidate) => candidate.word.toLowerCase() === word.word.toLowerCase(),
      ) === index,
  );

  console.log(`去重后 ${uniqueWords.length} 条`);

  const result = await importWords(uniqueWords);
  console.log(`Updated existing words: ${result.updated}`);

  console.log("\n导入完成:");
  console.log(`   成功导入: ${result.imported} 个`);
  console.log(`   已存在跳过: ${result.skipped} 个`);
  console.log(`   数据错误: ${result.errors} 个`);

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("导入失败:", error);
  await prisma.$disconnect();
  process.exit(1);
});
