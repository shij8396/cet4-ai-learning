<p align="center">
  <a href="README.md">简体中文</a> | <a href="README_EN.md">English</a>
</p>

# CET4 AI Learning

A learning and analytics application for China's College English Test Band 4 (CET-4). Built with **Python + FastAPI** and **Next.js + React**, it connects vocabulary reviews, daily check-ins, writing records, and learning statistics.

[![CI](https://github.com/shij8396/cet4-ai-learning/actions/workflows/ci.yml/badge.svg)](https://github.com/shij8396/cet4-ai-learning/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Quick Start](#quick-start) · [Feature Status](#feature-status) · [Architecture](#architecture) · [Roadmap](#roadmap)

## Purpose

Track learning activity, mistakes, and vocabulary mastery so daily tasks and progress reports reflect stored records. The project also explores Python backend development, relational modeling, learning activity aggregation, and automated testing.

## Feature Status

| Module                | Current capabilities                                                          | Status                                                       |
| --------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Authentication        | Registration, login, JWT validation, password hashing, logout token blacklist | Implemented                                                  |
| Vocabulary            | Search, pagination, filters, details, favorites, and wrong-word lists         | Implemented                                                  |
| Review                | Mastery levels, answer records, and simple review intervals                   | Implemented                                                  |
| Check-in              | Daily idempotency, consecutive-day tracking, and XP rewards                   | Implemented                                                  |
| Analytics             | Per-user and daily aggregation of reviews, writing, and check-ins             | Implemented                                                  |
| Daily tasks           | Record-based progress and priorities                                          | Implemented; reading/dictation progress pending              |
| Weakness tracking     | Wrong words and writing issues, ranking, and resolution records               | Implemented                                                  |
| Writing               | Local drafts, rule-based analysis, backend storage, history, and deletion     | Implemented; backend score values are supplied by the client |
| Achievements          | Progress based on streaks, mastered words, writing count, and XP              | Basic; reward distribution and unlock timestamps pending     |
| Reading and dictation | Frontend screens and partial supporting code                                  | Backend persistence pending                                  |
| AI assistance         | Provider adapters, prompts, and fallback-related code                         | Full FastAPI integration pending                             |

Reading and dictation counts currently remain zero. Study time only aggregates seconds reported by writing requests. Review scheduling uses a simple rule rather than SM-2/FSRS. This project is under active development.

## Architecture

```text
Browser / Mobile
       |
Next.js + React + TypeScript
       | REST /api/v1/*
FastAPI + Pydantic
       |                 |
SQLAlchemy + Alembic     Redis
       |                 └─ Revoked-token blacklist
MySQL / SQLite
       └─ Users, vocabulary, reviews, check-ins, writing, resolved weaknesses
```

| Layer                     | Technologies                                               |
| ------------------------- | ---------------------------------------------------------- |
| Backend                   | Python 3.12, FastAPI, Pydantic, Uvicorn                    |
| Data                      | SQLAlchemy 2, Alembic, MySQL 8.4, SQLite, Redis 7          |
| Authentication            | PyJWT, Passlib / bcrypt                                    |
| Frontend                  | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Zustand  |
| Components and charts     | Radix UI, Lucide, Recharts, Framer Motion                  |
| Validation and deployment | Pytest, Vitest, Playwright, GitHub Actions, Docker Compose |

### Engineering Highlights

- **Idempotent check-ins:** a unique user/date constraint and database transaction handle duplicate requests so a daily reward is issued once.
- **Learning aggregation:** user-scoped records and timezone-aware day boundaries support daily reports and historical trends.
- **Reviews and weaknesses:** review outcomes, mistake counts, mastery levels, and writing issues feed a prioritized weakness list.
- **Schema versioning:** Alembic manages schema changes, with vocabulary import scripts and frontend/backend regression checks.

## Quick Start

Requires **Node.js 20+** and **Python 3.12**. This setup uses SQLite and in-memory Redis, so Docker is optional.

### 1. Clone and install

```bash
git clone https://github.com/shij8396/cet4-ai-learning.git
cd cet4-ai-learning
npm ci
python -m pip install -r backend/requirements.txt
```

### 2. Configure the environment

Create `.env.local` in the repository root:

```env
NEXT_PUBLIC_API_BASE_URL="http://localhost:8000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Create `.env` inside `backend/`:

```env
DATABASE_URL="sqlite+pysqlite:///./dev.sqlite"
REDIS_URL="memory://"
JWT_SECRET_KEY="replace-with-a-long-random-secret"
CORS_ORIGINS="http://localhost:3000"
APP_TIMEZONE="Asia/Shanghai"
```

The backend reads `.env` from its working directory, so run it inside `backend/`. Use `memory://` only for single-process development and tests; it cannot share token revocation state across processes.

### 3. Initialize and start the backend

```bash
cd backend
python -m alembic upgrade head
python scripts/seed_words.py
python -m uvicorn app.main:app --reload --port 8000
```

The seed script imports `data/cet4-words.json`, falling back to the sample vocabulary if needed. It also creates the local demo account `test@cet4.com` / `test123456`. Remove this account or change its password before public deployment.

### 4. Start the frontend in another terminal

Run from the repository root:

```bash
npm run dev
```

- Application: [http://localhost:3000](http://localhost:3000)
- API documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
- Liveness: `GET /health`
- Database and Redis readiness: `GET /ready`

### MySQL and Redis

Start dependencies from the repository root:

```bash
docker compose up -d mysql redis
```

Update the connection strings in `backend/.env` to match your configuration:

```env
DATABASE_URL="mysql+pymysql://cet4:password@localhost:3306/cet4_learning"
REDIS_URL="redis://localhost:6379/0"
```

Then run migrations, import vocabulary, and start services. See the [deployment guide](docs/DEPLOYMENT.md) for the full container stack. Build the frontend with the intended API origin: `NEXT_PUBLIC_*` values are embedded into browser code at build time.

## API Overview

| Module              | Example endpoints                                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Authentication      | `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`                              |
| Vocabulary          | `GET /api/v1/words`, `GET /api/v1/words/{id}`                                                                    |
| Reviews             | `POST /api/v1/words/{id}/review`                                                                                 |
| Check-ins           | `GET /api/v1/checkin`, `POST /api/v1/checkin`                                                                    |
| Analytics and tasks | `GET /api/v1/analytics`, `GET /api/v1/dashboard/today`                                                           |
| Weaknesses          | `GET /api/v1/weakness`, `POST /api/v1/weakness/{type}/{refId}/resolve`                                           |
| Writing records     | `GET /api/v1/vocabulary/writing`, `POST /api/v1/vocabulary/writing`, `DELETE /api/v1/vocabulary/writing?id={id}` |

Authenticated requests use `Authorization: Bearer <token>`. Refer to FastAPI `/docs` for complete request schemas.

## Repository Structure

```text
backend/
  app/api/            API routes and authentication dependencies
  app/core/           Configuration and authentication helpers
  app/models/         SQLAlchemy models
  app/schemas/        Request and response validation
  app/services/       Business logic and serialization
  alembic/            Database migrations
  scripts/            Vocabulary initialization
  tests/              Backend API tests
src/
  app/                Next.js pages
  features/           Study, reading, dictation, and writing modules
  lib/                API client and shared utilities
  services/ai/        AI adapters and generation-related code
data/                 Vocabulary files
tests/e2e/            Browser tests
docs/                 Deployment notes and optimization plan
```

## Validation

Run frontend checks from the repository root:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

Backend checks use an isolated test database:

```bash
cd backend
python -m pytest -q
```

Vitest, Pytest, and Playwright are configured. GitHub Actions currently runs formatting, lint, type checks, unit tests, the production build, and backend tests. Browser E2E requires additional services and test environment setup and is not automatically run by this CI workflow.

## Roadmap

- [x] FastAPI authentication and vocabulary learning APIs
- [x] Core check-in, writing, analytics, and weakness data workflows
- [x] Database migrations, quality checks, and container configuration
- [ ] Backend persistence for reading and dictation
- [ ] SM-2/FSRS scheduling and user learning targets
- [ ] Backend AI services, streaming, usage metrics, and fallback
- [ ] Vocabulary ETL, quality reports, caching, and background jobs
- [ ] Administrator role authorization, authentication hardening, and performance validation

See the [optimization plan](docs/OPTIMIZATION_PLAN.md) for phases and acceptance criteria.

## Contributing and License

Report problems through Issues or improve the project through Pull Requests. See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidance. Licensed under the [MIT License](LICENSE).
