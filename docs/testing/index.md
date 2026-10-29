# Тестирование

## Стратегия

| Уровень | Где | Что покрывает |
|---|---|---|
| Unit + property | `apps/api/tests/ecobalance_core/` | формулы, аллокация, hotspots, меры/сценарии, конвертация единиц |
| Golden-кейсы | `tests/ecobalance_core/test_golden_cases.py` | три сквозных расчёта, числа идентичны `docs/methodology/formulas.md` |
| Integration (API) | `apps/api/tests/test_api_integration.py` | auth, полный цикл расчёта, сценарий, отчёты, изоляция компаний — против реального Postgres |
| Manual smoke (этот проход) | транскрипт сессии | полный путь через `curl` против живого API и живого Next.js dev-сервера; production-сборка Next.js (`next build`) |
| e2e (браузер) | — | **не реализовано**, см. [ADR-0005](../architecture/adr/0005-deferred-e2e-and-docs-screenshots.md) |

Текущее покрытие `ecobalance_core` по `pytest-cov`: **95%** (цель — ≥90%,
см. `PROMPT_CLAUDE_CODE.md` §11 Этап 1).

## Как добавить golden-кейс

1. Рассчитать вручную ожидаемые значения по формулам
   ([formulas.md](../methodology/formulas.md)).
2. Добавить тест в `test_golden_cases.py` с комментарием, показывающим
   расчёт (как у существующих трёх).
3. Добавить тот же кейс (с той же арифметикой) в
   `docs/methodology/formulas.md`, секция «Golden-кейсы» — документация
   и тесты обязаны совпадать.

## Property-тесты

`tests/ecobalance_core/test_properties.py` (hypothesis):

- линейность по масштабу (увеличение количества сырья на коэффициент
  `k` масштабирует Scope 3 на тот же `k`);
- сумма процентов разбивки ≈ 100% (допуск округления < 1%);
- фактор аллокации по массе всегда в `[0, 1]`;
- увеличение улавливаемого CO₂ никогда не повышает след.

## Запуск

```bash
docker compose up -d db          # нужен реальный Postgres
cd apps/api
uv run pytest --cov=ecobalance_core
```

Интеграционные тесты API создают/удаляют схему перед каждым тестом
(`tests/conftest.py`, не Alembic — быстрый путь для тестов) в
БД `ecobalance_test` (`TEST_DATABASE_URL`, по умолчанию
`localhost:5432`).

## Запуск в CI

`.github/workflows/ci.yml` поднимает временный Postgres-сервис
(`services.db`) для `api`-job — `TEST_DATABASE_URL` указывает на него.
