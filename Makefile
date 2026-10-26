.PHONY: up down demo check-clean docs-serve docs-build lint types test

up:
	docker compose up --build

down:
	docker compose down

# Stage 0: no-op placeholder. Stage 6 wires migrations + seed + demo user/companies.
demo:
	@echo "make demo: not implemented yet (lands in Stage 6: migrations + seed + demo data)."

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
	cd apps/web && pnpm exec tsc --noEmit

test:
	cd apps/api && uv run pytest
