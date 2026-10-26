# EcoBalance

Платформа расчёта и снижения углеродного следа химической продукции с
формированием отчёта для CBAM.

## Статус

Рабочий прототип для акселератора. Этапы реализации — см. `docs/changelog.md`
и `docs/open-questions.md`.

**Текущий этап: Stage 0 — каркас монорепозитория.** Бизнес-логика
(расчётное ядро, бэкенд, ЛК, лендинг) ещё не реализована.

## Быстрый старт

```bash
cp .env.example .env
make up      # docker compose up: db, api, web, docs
make demo    # появится в Stage 6
```

- API: http://localhost:8000/health
- Web: http://localhost:3000
- Docs: http://localhost:8001
