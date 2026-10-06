# CET4 AI Learning Optimization Plan

## Goal

Turn the current runnable skeleton into a data-backed learning application whose main workflows are implemented and testable.

## Phase 1 - Core learning data (completed 2026-10-05)

- Remove the unused Django implementation and generated local artifacts.
- Make daily check-in idempotent and persist streak history.
- Build analytics from review, check-in, and writing records.
- Generate weakness items from real wrong-word progress and persist resolved items.
- Persist writing records and expose history/detail APIs.
- Replace the static home dashboard with a backend-generated daily dashboard.
- Add Alembic migrations and focused backend tests.

Acceptance: repeated check-in grants XP once, wrong reviews appear in weakness results, resolved weaknesses stay hidden, writing records can be saved/read, and analytics reflect those actions.

## Phase 2 - Learning modules

- Persist reading articles and reading progress.
- Persist dictation sessions, answers, and accuracy statistics.
- Replace the simple interval rule with an SM-2/FSRS-style review scheduler.
- Add user settings and daily target persistence.

Acceptance: reading, dictation, and vocabulary all produce durable learning events and due-review queues.

## Phase 3 - AI service

- Move provider calls behind FastAPI so API keys never enter browser code.
- Add SSE streaming, timeouts, retries, rate limits, and provider fallback.
- Store prompt version, latency, token usage, and failure metadata.
- Feed real weakness and progress data into plans, recommendations, and writing feedback.

Acceptance: AI responses are observable, degradable, and based on persisted user data.

## Phase 4 - Data engineering and operations

- Build a versioned word/article ETL pipeline with validation and quality reports.
- Add Redis caching, background jobs, structured logs, metrics, and request IDs.
- Add MySQL integration tests, browser tests, and repeatable load tests.
- Harden refresh-token rotation, login throttling, and production secrets.

Acceptance: CI verifies migrations and workflows, while measured performance results can be reproduced.
