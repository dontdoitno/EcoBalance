# Архитектура: обзор

## Компоненты

```mermaid
graph LR
  Web["apps/web<br/>Next.js 15 (App Router)"] -->|fetch, cookie-сессия| API["apps/api<br/>FastAPI"]
  API --> Core["ecobalance_core<br/>чистый Python-пакет"]
  API --> DB[("PostgreSQL 16")]
  API --> Reports["app/reports<br/>Jinja2 + WeasyPrint + openpyxl"]
  Contracts["packages/contracts<br/>OpenAPI → TS типы"] -.->|генерируется из| API
  Contracts -.->|импортируется| Web
```

`ecobalance_core` не зависит от FastAPI/БД — это чистая методология
(units → models → scope1/2/3 → allocation → engine → hotspots →
measures/scenario). `app/` — тонкий слой вокруг него: модели БД, auth,
CRUD, генерация отчётов из уже посчитанного `CalculationResult`.

## Поток данных: от ввода к отчёту

```mermaid
sequenceDiagram
  participant U as Пользователь
  participant W as Next.js
  participant A as FastAPI
  participant C as ecobalance_core
  participant D as PostgreSQL

  U->>W: заполняет мастер (быстрый режим)
  W->>A: PATCH /calculations/{id} (автосохранение)
  A->>D: UPDATE calculation_inputs.data (JSONB)
  U->>W: "Рассчитать"
  W->>A: POST /calculations/{id}/calculate
  A->>C: CalculationInput → engine.calculate()
  C-->>A: CalculationResult (pcf_full, cbam_embedded, hotspots, ...)
  A->>D: UPSERT calculation_results.data
  A-->>W: CalculationResult (JSON)
  W->>U: страница результатов (график, hotspots, CBAM-банер)
  U->>W: выбирает меры сценария
  W->>A: POST .../scenarios {measure_ids}
  A->>C: scenario.run_scenario() — клон входа, мутации, повторный calculate()
  C-->>A: ScenarioResult (baseline, scenario, delta)
  A->>D: INSERT scenarios + scenario_measures
  A-->>W: ScenarioOut
  U->>W: "Скачать отчёт"
  W->>A: GET /reports/{id}?type=pcf|cbam|scenario&format=pdf|xlsx|json
  A->>A: app/reports/generator.py (Jinja2+WeasyPrint / openpyxl / json)
  A-->>W: файл (Content-Disposition: attachment)
```

## Монорепозиторий

```
apps/
  web/            # Next.js 15, React 19, TypeScript strict, Tailwind
  api/
    ecobalance_core/   # методология (Stage 1)
    app/               # FastAPI: routers, models, security, reports (Stage 2)
    alembic/           # миграции
    config/            # hotspots.yml, measures.yml
    scripts/           # seed.py, export_openapi.py
    tests/
packages/
  contracts/      # openapi.json + сгенерированные TS-типы (Stage 2)
docs/             # mkdocs (этот сайт)
```

## Границы изоляции между компаниями

Каждый запрос к `Calculation`/`Scenario`/`Report`/`Installation`
проходит через `company_id == current_user.company_id` на уровне
запроса (не на уровне ORM-политики БД) — см.
`app/routers/calculations.py::_get_own_calculation` и аналоги в других
роутерах. Проверено интеграционным тестом
(`test_company_isolation`): компания A получает `404`, а не `403`, при
попытке прочитать расчёт компании B — это не раскрывает даже факт
существования чужого ресурса.
