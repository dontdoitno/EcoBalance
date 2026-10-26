# Архитектура: обзор

Статус: план — наполняется по мере реализации этапов (C4-диаграммы,
потоки данных).

## Текущий каркас (Stage 0)

```
apps/web    — Next.js (placeholder)
apps/api    — FastAPI (/health, /ready) + ecobalance_core (пустой пакет)
packages/contracts — плейсхолдер OpenAPI→TS клиента
docs        — mkdocs
db          — PostgreSQL 16 (поднимается в docker-compose, миграций пока нет)
```
