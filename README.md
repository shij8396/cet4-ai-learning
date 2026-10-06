# CET4 AI Learning

A mobile-first CET-4 English learning app built on a split frontend/backend architecture.

## Architecture

- Frontend: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Zustand.
- Backend: FastAPI, SQLAlchemy, Alembic, MySQL in Docker, Redis for token blacklist/cache hooks.
- API boundary: frontend code calls the backend through `/api/v1/*`, optionally prefixed by `NEXT_PUBLIC_API_BASE_URL`.
- Tests: Vitest for frontend checks, pytest for backend API tests, Playwright for browser smoke coverage.

## Local Development

Install frontend dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
pip install -r backend/requirements.txt
```

Copy environment files:

```bash
cp .env.example .env.local
```

Start infrastructure and services:

```bash
docker compose up -d mysql redis
cd backend
python -m uvicorn app.main:app --reload --port 8000
cd ..
npm run dev
```

Open `http://localhost:3000`.

## Key Environment Variables

Frontend:

```env
NEXT_PUBLIC_API_BASE_URL="http://localhost:8000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Backend:

```env
DATABASE_URL="mysql+pymysql://cet4:password@localhost:3306/cet4_learning"
REDIS_URL="redis://localhost:6379/0"
JWT_SECRET_KEY="replace-with-a-long-random-secret"
CORS_ORIGINS="http://localhost:3000"
```

## Verification

Frontend:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Backend:

```bash
cd backend
python -m pytest
```

## Health Checks

- Backend liveness: `GET http://localhost:8000/health`
- Backend readiness: `GET http://localhost:8000/ready`

## Deployment

The frontend and backend are deployed as separate services. Set `NEXT_PUBLIC_API_BASE_URL` on the frontend to the public FastAPI origin. Run Alembic migrations for backend schema changes before promoting a backend release.
