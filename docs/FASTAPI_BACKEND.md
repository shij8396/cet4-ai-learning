# FastAPI + MySQL + Redis Backend

This project supports a gradual backend migration:

```text
Next.js frontend: http://localhost:3000
FastAPI backend: http://localhost:8000
MySQL: localhost:3306
Redis: localhost:6379
```

Core learning APIs live in `backend/`:

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
GET  /api/v1/words
GET  /api/v1/words/{word_id}
GET  /api/v1/words/favorites
GET  /api/v1/words/wrong
POST /api/v1/words/{word_id}/favorite
POST /api/v1/words/{word_id}/progress
POST /api/v1/words/{word_id}/review
```

## Local Backend Setup

```bash
python -m pip install -r backend/requirements.txt
cd backend
alembic upgrade head
python scripts/seed_words.py
uvicorn app.main:app --reload --port 8000
```

The seed script imports `data/cet4-words.json` and creates:

```text
test@cet4.com / test123456
```

## Docker Setup

```bash
docker compose up --build
```

The compose stack starts:

```text
app      Next.js frontend on 3000
backend  FastAPI on 8000
mysql    MySQL 8 on 3306
redis    Redis 7 on 6379
```

Migrated frontend APIs use:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```
