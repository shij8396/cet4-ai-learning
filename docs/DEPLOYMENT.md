# Deployment Notes

This project keeps SQLite as the default local database because it is fast to start and easy to inspect. For a shared production deployment, use PostgreSQL or another managed relational database.

## Local Development

```bash
cp .env.example .env.local
npm install
npm run db:push
npx tsx prisma/seed.ts
npm run dev
```

Recommended local values:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="replace-with-a-long-random-secret"
AUTH_URL="http://localhost:3000"
```

## Production Checklist

- Use a managed PostgreSQL database instead of `dev.db`.
- Set a long random `AUTH_SECRET`.
- Keep AI provider keys optional; the core study flow must still run when AI calls fail.
- Run `npm run check`, `npm test`, and `npm run build` before deploying.
- Do not upload `.env*`, `dev.db`, Playwright auth state, build outputs, or logs.

## PostgreSQL Path

The current Prisma schema is SQLite-first. Before moving production traffic to PostgreSQL, create a PostgreSQL migration branch and verify these steps:

```bash
npm run db:generate
npm run db:migrate
npm run check
npm test
npm run build
```

Then seed the CET-4 word list in the target database:

```bash
npx tsx prisma/seed.ts
```

## GitHub Actions

The repository can run automated checks with GitHub Actions, but publishing workflow files requires a GitHub token that includes the `workflow` scope. If that scope is not available, keep the workflow local and run the commands above before pushing.
