import { pathToFileURL } from "url";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

import { PrismaClient } from "../../../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 开始生成测试数据...\n");

  const hashedPassword = await bcrypt.hash("test123456", 12);
  const e2eHashedPassword = await bcrypt.hash("E2eTest123!", 12);

  const testUser = await prisma.user.upsert({
    where: { email: "test@cet4.com" },
    update: { password: hashedPassword },
    create: {
      email: "test@cet4.com",
      password: hashedPassword,
      name: "Test User",
    },
  });
  console.log(`✅ 测试用户创建: ${testUser.email}`);

  const e2eUser = await prisma.user.upsert({
    where: { email: "e2e-test@cet4.com" },
    update: { password: e2eHashedPassword },
    create: {
      email: "e2e-test@cet4.com",
      password: e2eHashedPassword,
      name: "E2E Tester",
    },
  });
  console.log(`✅ E2E 测试用户创建: ${e2eUser.email}`);

  console.log("\n🎉 测试数据生成完成!");
}

export default async function globalSetup() {
  try {
    await main();
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
    .catch((e) => {
      console.error("❌ 测试数据生成失败:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
