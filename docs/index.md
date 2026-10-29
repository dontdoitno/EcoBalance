# EcoBalance

Платформа расчёта и снижения углеродного следа химической продукции с
формированием отчёта для CBAM.

## Статус

Рабочий прототип для акселератора. Этапы реализации — см. `docs/changelog.md`
и `docs/open-questions.md`.

**Текущий этап: Stages 0–6 реализованы.** Расчётное ядро, бэкенд, ЛК и
лендинг работают end-to-end. Осознанно отложенные пункты (не скрытые) —
см. `docs/open-questions.md` и соответствующие ADR: Playwright e2e,
скриншоты руководства пользователя, полный режим мастера ввода,
верифицированные (не демонстрационные) коэффициенты выбросов.

## Быстрый старт

```bash
cp .env.example .env
make up       # docker compose up: db, api, web, docs
make migrate  # применить миграции Alembic
make demo     # migrate + сид демо-данных (демо-пользователь + 3 компании)
```

- API: http://localhost:8000/health
- Web: http://localhost:3000
- Docs: http://localhost:8001
