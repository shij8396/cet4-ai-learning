# CET4 AI Learning

一个面向大学英语四级备考的移动端优先学习 App。项目基于 Next.js、Prisma、PostgreSQL、NextAuth 和本地 CET-4 词库，覆盖单词、阅读、默写、作文、今日计划和薄弱点复习闭环。

## 功能

- 今日学习计划：根据到期复习词、阅读进度、薄弱点和作文状态生成任务。
- 四级词库：内置 CET-4 词库，支持搜索、发音、例句、收藏、错词复习。
- 单词学习：基于掌握度记录新学、复习、不认识和跳过结果。
- 阅读训练：分级阅读、全文译文、点词速查、音标和释义展示。
- 默写练习：从真实词库、到期复习词和错词生成练习队列。
- 作文助手：检测拼写、超纲词、词汇覆盖率，并按规则提供可降级评分建议。
- 薄弱点中心：聚合错词、生词、阅读点查词、默写错误和作文问题词，支持处理归档。
- 企业级基线：统一 API 错误、权限控制、限流、审计日志、健康检查和 CI。

## 技术栈

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Prisma 7
- PostgreSQL
- NextAuth
- Zustand
- Vitest
- Playwright
- next-pwa

## 本地运行

### 环境要求

- Node.js 20+
- npm
- Docker Desktop

### 安装依赖

```bash
npm install
```

### 配置环境变量

```bash
cp .env.example .env.local
```

默认开发数据库：

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/cet4_learning"
AUTH_SECRET="replace-with-a-long-random-secret"
AUTH_URL="http://localhost:3000"
ADMIN_USER_IDS=""
```

AI 功能是可选能力。没有 API key 时，单词、阅读、默写、作文基础流程仍可运行，AI 相关接口会返回规则降级结果。

### 启动数据库

```bash
docker compose up -d db
```

### 初始化数据库和词库

```bash
npm run db:deploy
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

## 健康检查

```text
GET /api/health
GET /api/ready
```

`/api/health` 检查服务存活；`/api/ready` 检查数据库连接、词库数量和 AI provider 配置状态。

## 常用命令

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e -- --project=chromium-desktop
```

## 部署

生产默认使用 PostgreSQL。部署前需要设置 `DATABASE_URL`、`AUTH_SECRET`、`AUTH_URL`，并执行 Prisma migration：

```bash
npm run db:deploy
```

详细说明见 [部署说明](./docs/DEPLOYMENT.md)。

## 数据说明

- `data/cet4-words.json`：CET-4 词库数据。
- `.env.local`：本地密钥配置，已加入 `.gitignore`，不会提交到仓库。
- PostgreSQL 数据卷由 Docker Compose 管理，不提交到仓库。

## 开源协议

本项目基于 MIT License 开源，详见 [LICENSE](./LICENSE)。
