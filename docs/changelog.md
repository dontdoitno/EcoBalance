# Changelog

## Stage 0 — Каркас

- Структура монорепозитория: `apps/web` (Next.js placeholder),
  `apps/api` (FastAPI `/health`/`/ready` + пустой пакет `ecobalance_core`),
  `packages/contracts` (плейсхолдер).
- `docker-compose.yml` (db/api/web/docs), `Makefile`, `.env.example`.
- `mkdocs-material` каркас с полной навигацией (разделы-заглушки).
- `scripts/check_stopwords.sh` + `.stopwords.local.example` /
  `.stopwords.local` (пустой).
- CI (`.github/workflows/ci.yml`): lint, types, tests, `mkdocs build
  --strict`, `check-clean`.
- ADR-0001: выбор стека.
