# Эксплуатация

## Запуск

```bash
cp .env.example .env
docker compose up --build   # или: make up
make migrate                # применить миграции Alembic (DATABASE_URL=...localhost... при запуске вне docker)
make demo                    # migrate + сид демо-данных (демо-пользователь + 3 компании)
```

- Web: http://localhost:3000
- API: http://localhost:8000/health
- Docs: http://localhost:8001

`make demo` выводит логин/пароль демо-пользователя
(`demo@ecobalance-demo.ru` / `demo12345`) — он привязан к первой из трёх
демо-компаний; две другие заведены с собственными сид-пользователями
(не предназначены для логина в демо-сценарии, только для показа
множественных компаний в данных).

## Переменные окружения

См. `.env.example`. Ключевые: `DATABASE_URL` (asyncpg, внутри Docker —
хост `db`; при запуске API/тестов на хосте — `localhost`),
`API_SECRET_KEY` (подпись JWT — обязательно сменить при развёртывании),
`NEXT_PUBLIC_API_BASE_URL` (откуда фронтенд берёт адрес API).

## Docker

`docker-compose.yml` поднимает `db` (Postgres 16), `api` (FastAPI,
`uv sync` + `uvicorn --reload`), `web` (Next.js), `docs` (mkdocs serve).
`apps/api/Dockerfile` и `apps/web/Dockerfile` — отдельные образы;
`apps/api/Dockerfile` устанавливает системные библиотеки WeasyPrint
(`libpango`, `libgdk-pixbuf` и т.п.) — без них генерация PDF не работает
на Debian-базовых образах.

## Миграции

Alembic, async-шаблон (`alembic/env.py` читает `app.config.settings` и
`app.models` метаданные). Новая миграция:

```bash
cd apps/api
DATABASE_URL=postgresql+asyncpg://ecobalance:<пароль>@localhost:5432/ecobalance \
  uv run alembic revision --autogenerate -m "описание"
```

## Бэкапы

**Не реализовано в этой версии** — для MVP-прототипа не настроен
регулярный бэкап `ecobalance_db_data` volume. Перед использованием
дальше демо-контекста нужно добавить `pg_dump`-джоб и ротацию.

## CI

`.github/workflows/ci.yml`: `check-clean` (стоп-слова), `api` (ruff,
mypy strict на `ecobalance_core` и обычный на `app`, pytest с реальным
Postgres-сервисом в контейнере CI), `web` (eslint, tsc), `docs`
(`mkdocs build --strict`). WeasyPrint системные зависимости
устанавливаются отдельным шагом в `api`-job.
