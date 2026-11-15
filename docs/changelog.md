# Changelog

## Пост-Stage 6 (15.11.2026) — `inner_docs/new_features.md` + CBAM 1:1 с cbamtrack.com

- Мастер, шаг 1 («Продукт»): несколько маршрутов производства одного
  товара (`CalculationInput.processes`) с долей выпуска и опциональным
  своим коэффициентом выбросов — усредняются в один
  CBAM/PCF-результат, см. [cbam.md](methodology/cbam.md).
- Мастер, шаг 2 («Сырьё и энергия»): несколько видов сырья (backend это
  уже поддерживал — не хватало UI).
- CBAM-отчёт (PDF/XLSX/веб) приближен к структуре официального Annex I:
  построчные прекурсоры, таблица маршрутов, метка «простой/сложный
  товар» — и затем, по отдельному запросу, добавлена отдельная таблица
  из 12 полей, повторяющая пример
  cbamtrack.com/cbam-reporting-template поле-в-поле (Declarant Name,
  EORI Number, CN Code, Country of Origin, Quantity, Direct/Indirect/
  Total Embedded Emissions, Emission Factor Source, Carbon Price Paid,
  Free Allocation) — см. [cbam-mapping.md](methodology/cbam-mapping.md).
  Новые поля: `Company.country`/`Company.eori` (миграция
  `78d883ca545b`), `CalculationInput.actual_output_t`/
  `carbon_price_paid_eur_per_t`. Free Allocation — официальный график
  фазаута бесплатных квот EU ETS (CBAM Regulation (EU) 2023/956,
  Art. 31a), не демо-значение.
- `ecobalance_core/reference.py`: таблица топлива (`FUELS`) расширена
  8 → 14 позиций и сверена с EU CBAM Guidance Document 3 (Annex D,
  IPCC 2006 GL) — помечена `is_demo=False`, в отличие от остального
  справочника. Правило «простой/сложный товар»
  (`Product.requires_precursor_accounting`) по тому же документу.
  Регионы энергосистемы (`REGIONS`) переструктурированы с устаревшей
  группировки «ОЭС» на реальные ценовые/неценовые зоны atsenergo.ru —
  4 из 5 записей на реальных данных (среднесуточные за один день,
  не верифицированное годовое значение), см.
  [emission-factors.md](methodology/emission-factors.md).
- Новые тесты: `test_processes_and_precursors.py` (многомаршрутное
  усреднение, кастомный коэффициент, правило прекурсоров),
  `test_cbam_report_matches_cbamtrack_template` в
  `test_api_integration.py`.

## Stages 1–6 — Расчётное ядро, backend, фронтенд, отчёты, документация

- **Stage 1**: `ecobalance_core` — units, Pydantic-модели входа/выхода,
  демо-справочники (8 видов топлива, 12 видов сырья, 8 регионов ОЭС, 6
  видов транспорта, 5 способов обращения с отходами, 7 продуктов с
  CBAM-применимостью и CN-кодами), 4 метода аллокации, Scope 1/2/3,
  разведение `pcf_full`/`cbam_embedded`, hotspots (конфиг
  `config/hotspots.yml`), каталог из 5 мер оптимизации с реальным
  пересчётом модели (`config/measures.yml`). 33 теста
  (golden-кейсы + property-тесты на hypothesis), 95% покрытие,
  `mypy --strict` и `ruff` чисто.
- **Stage 2**: FastAPI-приложение (`app/`) — SQLAlchemy 2.0 async
  модели + Alembic-миграция, argon2 + JWT-сессия в httpOnly cookie,
  rate limiting (`slowapi`), CRUD компании/площадок/расчётов,
  автосохранение черновика, `/calculate`, `/finalize`, сценарии,
  публичные справочники, генерация отчётов PDF (Jinja2+WeasyPrint)/
  XLSX (openpyxl)/JSON, `scripts/seed.py` (демо-пользователь + 3
  демо-компании), экспорт OpenAPI. 7 интеграционных тестов против
  реального Postgres (изоляция компаний, полный цикл расчёта, отказ
  CBAM-отчёта для неприменимого продукта).
- **Stage 3**: дизайн-токены (`globals.css`, `tailwind.config.ts`) —
  светлая/тёмная тема, WCAG AA контраст статусных цветов с
  неодноцветными маркерами (иконка + подпись), шрифт Inter (кириллица).
- **Stage 4**: ЛК — регистрация/вход, профиль компании и площадок,
  дашборд расчётов, мастер (быстрый режим, автосохранение), результаты
  (разбивка, hotspots, CBAM-банер), сценарии (выбор мер, диаграмма
  до/после), отчёты (скачивание PDF/XLSX/JSON).
- **Stage 5**: лендинг — hero, проблема с интерактивным
  мини-калькулятором ETS-стоимости, 4 шага «как это работает», реальный
  пример расчёта (вывод ядра, не фикция), стандарты, FAQ, CTA.
- **Stage 6**: `make demo` (migrate + seed), демо-сценарий
  (`docs/product/demo-script.md`). Легаси Vite-прототип (`src/`,
  `index.html`, корневой `package.json` и конфиги) удалён после
  достижения функционального паритета новым приложением; README
  переписан под монорепозиторий.
- `packages/contracts`: реальный сгенерированный TS-клиент
  (`openapi-typescript`) вместо плейсхолдера.
- Документация: заполнены все методологические, архитектурные
  (включая ADR-0002..0005), API/frontend/design/operations/testing/
  user-guide/product страницы; `open-questions.md` и этот файл —
  синхронизированы с фактическим кодом.
- CI: добавлен Postgres-сервис и системные зависимости WeasyPrint в
  `api`-job; `app` (не только `ecobalance_core`) проверяется `mypy`.
- Осознанно отложено (см. соответствующие ADR/open-questions, не
  скрыто): Playwright e2e, скриншоты `user-guide/`, полный
  интерактивный `impeccable audit`/`polish`, полный режим мастера
  (разделы 0–8), верифицированные (не демо) коэффициенты выбросов,
  ротация refresh-токена, `AuditLog` подключение, регулярные бэкапы БД.

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
