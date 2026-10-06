<p align="center">
  <a href="README.md">简体中文</a> | <a href="README_EN.md">English</a>
</p>

# CET4 AI Learning · 英语四级学习平台

面向大学英语四级备考的学习与数据分析应用，以 **Python + FastAPI** 为后端、**Next.js + React** 为前端，将单词复习、每日签到、作文记录和学习统计连接起来。

[![CI](https://github.com/shij8396/cet4-ai-learning/actions/workflows/ci.yml/badge.svg)](https://github.com/shij8396/cet4-ai-learning/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[快速开始](#快速开始) · [功能状态](#功能状态) · [架构](#架构) · [开发计划](#开发计划)

## 项目目标

记录学习过程，追踪错词与掌握度，让每日任务和学习趋势由真实记录驱动。项目也用于实践 Python 后端开发、关系数据库建模、学习行为聚合与自动化测试。

## 功能状态

| 模块       | 当前能力                                          | 状态                               |
| ---------- | ------------------------------------------------- | ---------------------------------- |
| 用户认证   | 注册、登录、JWT 鉴权、密码哈希、退出 Token 黑名单 | 已实现                             |
| 四级词库   | 搜索、分页、筛选、详情、收藏与错词本              | 已实现                             |
| 单词复习   | 掌握度、答题记录与简单间隔复习时间                | 已实现                             |
| 每日签到   | 同日幂等、连续天数、经验奖励                      | 已实现                             |
| 学习统计   | 按用户与日期聚合复习、作文和签到记录              | 已实现                             |
| 今日任务   | 根据记录生成任务进度与优先级                      | 已实现，阅读/听写进度待接入        |
| 薄弱项     | 错词与作文问题词归集、排序、处理归档              | 已实现                             |
| 写作       | 本地草稿、规则分析、后端保存、历史与删除          | 已实现；后端评分字段由客户端提供   |
| 成就       | 根据连续签到、掌握词汇、作文数量和 XP 计算进度    | 基础实现；奖励发放与解锁时间待完善 |
| 阅读与听写 | 前端页面及部分基础代码                            | 后端持久化待完善                   |
| AI 辅助    | Provider 适配、Prompt 与降级相关代码              | FastAPI 主链路尚未完整接入         |

统计中的阅读、听写次数尚为零；学习时长当前仅汇总作文请求上报的秒数。单词调度使用简单规则，尚未采用 SM-2/FSRS。项目处于持续开发阶段。

## 架构

```text
浏览器 / 移动端
       |
Next.js + React + TypeScript
       | REST /api/v1/*
FastAPI + Pydantic
       |                 |
SQLAlchemy + Alembic     Redis
       |                 └─ Token 注销黑名单
MySQL / SQLite
       └─ 用户、词库、复习、签到、作文、薄弱项归档
```

| 层次       | 技术                                                       |
| ---------- | ---------------------------------------------------------- |
| 后端       | Python 3.12、FastAPI、Pydantic、Uvicorn                    |
| 数据层     | SQLAlchemy 2、Alembic、MySQL 8.4、SQLite、Redis 7          |
| 认证       | PyJWT、Passlib / bcrypt                                    |
| 前端       | Next.js 16、React 19、TypeScript、Tailwind CSS 4、Zustand  |
| 组件与图表 | Radix UI、Lucide、Recharts、Framer Motion                  |
| 验证与部署 | Pytest、Vitest、Playwright、GitHub Actions、Docker Compose |

### 工程要点

- **签到幂等**：通过用户与日期的联合唯一约束和数据库事务处理重复签到，奖励仅发放一次。
- **学习记录聚合**：按用户隔离数据，并按配置时区计算每日统计边界，支持今日数据和历史趋势。
- **复习与薄弱项**：保存每次复习结果，结合错误次数、掌握度和作文问题词生成待处理薄弱项。
- **数据版本管理**：使用 Alembic 管理结构变更；提供词库导入脚本与前后端回归检查。

## 快速开始

需要 **Node.js 20+**、**Python 3.12**。下面使用 SQLite 与内存 Redis，可在不安装 Docker 的情况下运行。

### 1. 获取项目并安装依赖

```bash
git clone https://github.com/shij8396/cet4-ai-learning.git
cd cet4-ai-learning
npm ci
python -m pip install -r backend/requirements.txt
```

### 2. 配置环境

在项目根目录创建 `.env.local`：

```env
NEXT_PUBLIC_API_BASE_URL="http://localhost:8000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

在 `backend/` 创建 `.env`：

```env
DATABASE_URL="sqlite+pysqlite:///./dev.sqlite"
REDIS_URL="memory://"
JWT_SECRET_KEY="replace-with-a-long-random-secret"
CORS_ORIGINS="http://localhost:3000"
APP_TIMEZONE="Asia/Shanghai"
```

后端默认从启动目录读取 `.env`，因此应在 `backend/` 内启动服务。`memory://` 仅适合单进程开发与测试，不能跨进程共享注销状态。

### 3. 初始化并启动后端

```bash
cd backend
python -m alembic upgrade head
python scripts/seed_words.py
python -m uvicorn app.main:app --reload --port 8000
```

种子脚本优先导入 `data/cet4-words.json`，不存在时使用样本词库，同时创建本地演示账号 `test@cet4.com` / `test123456`。公开部署前应删除演示账号或更换密码。

### 4. 在另一个终端启动前端

从项目根目录执行：

```bash
npm run dev
```

- 应用：[http://localhost:3000](http://localhost:3000)
- 接口文档：[http://localhost:8000/docs](http://localhost:8000/docs)
- 存活检查：`GET /health`
- 数据库与 Redis 就绪检查：`GET /ready`

### MySQL 与 Redis

从根目录启动依赖：

```bash
docker compose up -d mysql redis
```

将 `backend/.env` 中连接地址调整为实际配置：

```env
DATABASE_URL="mysql+pymysql://cet4:password@localhost:3306/cet4_learning"
REDIS_URL="redis://localhost:6379/0"
```

再执行数据库迁移、词库导入和启动步骤。完整容器编排见 [部署文档](docs/DEPLOYMENT.md)；部署时应使用实际 API 地址构建前端，因为 `NEXT_PUBLIC_*` 会在构建时写入浏览器代码。

## 接口概览

| 模块       | 接口示例                                                                                                         |
| ---------- | ---------------------------------------------------------------------------------------------------------------- |
| 认证       | `POST /api/v1/auth/register`、`POST /api/v1/auth/login`、`POST /api/v1/auth/logout`                              |
| 词库       | `GET /api/v1/words`、`GET /api/v1/words/{id}`                                                                    |
| 复习       | `POST /api/v1/words/{id}/review`                                                                                 |
| 签到       | `GET /api/v1/checkin`、`POST /api/v1/checkin`                                                                    |
| 统计与任务 | `GET /api/v1/analytics`、`GET /api/v1/dashboard/today`                                                           |
| 薄弱项     | `GET /api/v1/weakness`、`POST /api/v1/weakness/{type}/{refId}/resolve`                                           |
| 作文记录   | `GET /api/v1/vocabulary/writing`、`POST /api/v1/vocabulary/writing`、`DELETE /api/v1/vocabulary/writing?id={id}` |

需要认证的请求通过 `Authorization: Bearer <token>` 传递身份。完整请求结构以 FastAPI `/docs` 为准。

## 目录

```text
backend/
  app/api/            API 路由与鉴权依赖
  app/core/           配置与认证工具
  app/models/         SQLAlchemy 数据模型
  app/schemas/        请求与响应校验
  app/services/       业务逻辑与序列化
  alembic/            数据库迁移
  scripts/            词库初始化
  tests/              后端接口测试
src/
  app/                Next.js 页面
  features/           学习、阅读、听写、写作模块
  lib/                API 客户端与通用工具
  services/ai/        AI 适配与生成相关代码
data/                 词库文件
tests/e2e/            浏览器测试
docs/                 部署说明与优化计划
```

## 验证

从项目根目录运行前端检查：

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

后端检查使用独立测试数据库：

```bash
cd backend
python -m pytest -q
```

已配置 Vitest、Pytest 和 Playwright；GitHub Actions 当前执行格式、Lint、类型检查、单元测试、构建与后端测试。浏览器 E2E 需要额外配置服务与测试环境，不在该 CI 流程中自动执行。

## 开发计划

- [x] FastAPI 用户认证与单词学习接口
- [x] 签到、作文、统计与薄弱项基础数据链路
- [x] 数据库迁移、质量检查和容器配置
- [ ] 阅读与听写的后端持久化
- [ ] SM-2/FSRS 复习调度与用户学习目标
- [ ] AI 后端服务、流式输出、调用统计与降级
- [ ] 词库 ETL、数据质量报告、缓存与异步任务
- [ ] 管理员角色授权、认证强化与性能验证

详细阶段与验收条件见 [优化计划](docs/OPTIMIZATION_PLAN.md)。

## 参与与许可证

欢迎通过 Issues 提交问题，或通过 Pull Requests 改进功能。参与方式见 [CONTRIBUTING.md](CONTRIBUTING.md)。项目采用 [MIT License](LICENSE)。
