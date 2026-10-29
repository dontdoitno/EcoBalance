# EcoBalance

Платформа расчёта и снижения углеродного следа химической продукции с
формированием отчёта для CBAM (ISO 14067 / GHG Protocol / LCA).

Рабочий прототип для акселератора. Экспортёры химической продукции
(удобрения, полимеры, нефтехимия) рассчитывают Scope 1–3 по методике
LCA, получают карту «слабых мест», моделируют меры снижения выбросов
пересчётом модели и формируют отчёт PCF (ISO 14067) или CBAM.

Полная документация: [`docs/`](docs/index.md) (методология, архитектура,
API, фронтенд, дизайн, эксплуатация, тестирование, руководство
пользователя) — см. `make docs-serve`.

## Монорепозиторий

```
apps/
  web/        Next.js 15, React 19, TypeScript — лендинг, ЛК
  api/
    ecobalance_core/   расчётное ядро (LCA/CBAM, без зависимостей от FastAPI/БД)
    app/               FastAPI: auth, CRUD, отчёты
packages/
  contracts/  OpenAPI → TypeScript клиент
docs/         mkdocs-документация
```

## Запуск

```bash
cp .env.example .env
docker compose up --build   # или: make up
make migrate                # миграции Alembic
make demo                   # migrate + демо-данные (демо-пользователь + 3 компании)
```

- Web: http://localhost:3000
- API: http://localhost:8000/health
- Docs: http://localhost:8001

Демо-логин: `demo@ecobalance-demo.ru` / `demo12345` — сценарий
демонстрации: [`docs/product/demo-script.md`](docs/product/demo-script.md).

## Разработка без Docker

```bash
# API
cd apps/api
uv sync --all-groups
DATABASE_URL=postgresql+asyncpg://ecobalance:<пароль>@localhost:5432/ecobalance \
  uv run uvicorn app.main:app --reload

# Web
cd apps/web
pnpm install
pnpm dev
```

## Проверки

```bash
make lint   # ruff + eslint
make types  # mypy (strict на ecobalance_core) + tsc
make test   # pytest (ecobalance_core + API-интеграционные тесты, нужен Postgres)
make docs-build  # mkdocs build --strict
```

Коэффициенты выбросов в текущей версии — демонстрационные (`is_demo`),
не для подачи в реальную декларацию. Подробности и осознанно отложенные
пункты — [`docs/open-questions.md`](docs/open-questions.md).
