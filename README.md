# CET4 AI Learning

一个面向大学英语四级备考的移动优先学习 App。项目基于 Next.js、Prisma、SQLite 和本地 CET-4 词库，覆盖单词、阅读、默写、作文和薄弱点复习等核心学习闭环。

## 功能

- 今日任务台：集中展示每日单词、阅读、默写、作文任务和完成状态。
- 四级词库：内置完整 CET-4 词库，支持搜索、发音、例句、收藏、错词复习。
- 单词学习：基于掌握度记录新学、复习、不认识和跳过结果。
- 阅读训练：分级阅读、全文译文、点词速查、音标和释义展示。
- 默写练习：从真实词库生成题目，支持中文到英文、听音拼写、例句填空和错词强化。
- 作文助手：实时检测拼写错误、超纲词和词汇覆盖率，AI 能力可选降级。
- 薄弱点中心：聚合错词、生词、默写错误和作文问题词，支持集中复习。
- PWA：支持移动端安装和基础离线能力。

## 技术栈

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Prisma 7
- SQLite / better-sqlite3
- NextAuth
- Zustand
- Vitest
- Playwright
- next-pwa

## 本地运行

### 环境要求

- Node.js 20+
- npm

### 安装

```bash
npm install
```

### 配置环境变量

```bash
cp .env.example .env.local
```

默认使用 SQLite：

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="replace-with-a-long-random-secret"
AUTH_URL="http://localhost:3000"
```

AI 功能是可选能力。没有 API key 时，单词、阅读、默写、作文基础流程仍可运行。

### 初始化数据库和词库

```bash
npm run db:push
npm run db:generate
npx tsx prisma/seed.ts
```

seed 会导入 `data/cet4-words.json` 中的 CET-4 词库，并创建本地测试账号：

```text
test@cet4.com / test123456
```

### 启动开发服务

```bash
npm run dev
```

访问：

```text
http://localhost:3000
```

## 常用命令

```bash
npm run check
npm test
npm run build
npm run test:e2e
```

## 数据说明

- `data/cet4-words.json`：完整 CET-4 词库数据。
- `dev.db`：本地 SQLite 数据库，已加入 `.gitignore`，不会提交到仓库。
- `.env.local`：本地密钥配置，已加入 `.gitignore`，不会提交到仓库。

## 开源协议

本项目基于 MIT License 开源。详见 [LICENSE](./LICENSE)。
