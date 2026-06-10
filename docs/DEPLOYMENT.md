# Deployment Notes

This project is PostgreSQL-first. SQLite is no longer the enterprise default path.

## Local Development

```bash
cp .env.example .env.local
npm install
docker compose up -d db
npm run db:deploy
npx tsx prisma/seed.ts
npm run dev
```

Recommended local values:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/cet4_learning"
AUTH_SECRET="replace-with-a-long-random-secret"
AUTH_URL="http://localhost:3000"
ADMIN_USER_IDS=""
```

## Production Checklist

- Use a managed PostgreSQL database.
- Set a long random `AUTH_SECRET`.
- Configure `AUTH_URL` to the public application origin.
- Keep AI provider keys optional; the core study flow must still run when AI calls fail.
- Run `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Run `npm run db:deploy` before starting the application.
- Do not upload `.env*`, Playwright auth state, build outputs, logs, or database dumps.

## Database Migration

For a fresh PostgreSQL database:

```bash
npm run db:deploy
npx tsx prisma/seed.ts
```

For schema changes:

```bash
npx prisma migrate dev --name <change_name>
npm run db:generate
npm test
```

The seed script imports the CET-4 word list from `data/cet4-words.json` and creates a local test account.

## Health Checks

- `GET /api/health`: process liveness.
- `GET /api/ready`: database connectivity, CET-4 word count, and AI provider configuration.

Use `/api/ready` as the stronger deployment readiness probe.

## GitHub Actions

The repository includes a CI workflow for format, lint, typecheck, unit tests, production build, PostgreSQL migration/seed, and Playwright smoke tests.

Publishing workflow files requires a GitHub token with the `workflow` scope. If your token lacks that scope, run the same commands locally before pushing code.
