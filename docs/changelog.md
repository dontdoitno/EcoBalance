# Changelog

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
