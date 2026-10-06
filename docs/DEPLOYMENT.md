# Deployment Notes

The app now uses a split deployment model:

- Next.js frontend serves the web application.
- FastAPI backend owns authentication, data access, and `/api/v1/*`.
- MySQL stores application data.
- Redis is available for token blacklist and cache-related backend hooks.

## Frontend

Required variables:

```env
NEXT_PUBLIC_API_BASE_URL="https://api.example.com"
NEXT_PUBLIC_APP_URL="https://app.example.com"
```

Build command:

```bash
npm run build
```

## Backend

Required variables:

```env
DATABASE_URL="mysql+pymysql://USER:PASSWORD@HOST:3306/DATABASE"
REDIS_URL="redis://HOST:6379/0"
JWT_SECRET_KEY="replace-with-a-long-random-secret"
CORS_ORIGINS="https://app.example.com"
```

Install and run:

```bash
pip install -r backend/requirements.txt
cd backend
alembic upgrade head
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Checks

Run before release:

```bash
npm run lint
npm run typecheck
npm test
npm run build
cd backend
python -m pytest
```

Use `/health` for liveness and `/ready` for readiness.
