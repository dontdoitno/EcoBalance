.PHONY: up down migrate demo check-clean docs-serve docs-build lint types test

up:
	docker compose up --build

down:
	docker compose down

# Applies pending Alembic migrations against DATABASE_URL (default: .env's
# docker-network URL; override for host-side runs, e.g.
# DATABASE_URL=postgresql+asyncpg://ecobalance:<password>@localhost:5432/ecobalance make migrate).
migrate:
	cd apps/api && uv run alembic upgrade head

# Migrations + seed reference data/demo user/3 demo companies with calculations.
demo: migrate
	cd apps/api && uv run python -m scripts.seed

check-clean:
	./scripts/check_stopwords.sh

docs-serve:
	cd docs-venv 2>/dev/null || true
	mkdocs serve -a 0.0.0.0:8001

docs-build:
	mkdocs build --strict

lint:
	cd apps/api && uv run ruff check .
	cd apps/web && pnpm lint

types:
	cd apps/api && uv run mypy --strict ecobalance_core
	cd apps/api && uv run mypy app
	cd apps/web && pnpm exec tsc --noEmit

# Runs ecobalance_core + API integration tests. Needs a reachable Postgres
# (docker compose up -d db) and TEST_DATABASE_URL if not localhost:5432.
test:
	cd apps/api && uv run pytest --cov=ecobalance_core
