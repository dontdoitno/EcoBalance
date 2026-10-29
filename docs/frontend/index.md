# Фронтенд

`apps/web/` — Next.js 15 (App Router), React 19, TypeScript strict,
Tailwind CSS.

## Структура

```
app/
  page.tsx                          # лендинг (Persuade)
  login/, register/                 # аутентификация
  dashboard/                        # список расчётов
  profile/                          # компания + площадки
  calculations/[id]/
    page.tsx                        # мастер ввода (быстрый режим)
    results/page.tsx                # результаты + hotspots
    scenarios/page.tsx              # сценарии оптимизации
    reports/page.tsx                # скачивание отчётов
  providers.tsx                     # TanStack Query provider
  globals.css                       # дизайн-токены (CSS-переменные)
components/
  app-shell.tsx                     # навигация для ЛК
  ui/                                # Button, Input/Select/Label, Card, RatingBadge
  landing/mini-calculator.tsx       # интерактивный калькулятор на лендинге
lib/
  api-client.ts                     # openapi-fetch, типизированный по packages/contracts
  types.ts                          # ручные типы для нетипизированных ответов API
  format.ts                         # форматирование чисел/дат (ru-RU)
  dictionaries/ru.ts                # все тексты UI (не хардкод по компонентам)
  hooks/                            # use-session, use-reference (TanStack Query)
middleware.ts                       # редирект на /login без сессионной cookie
```

## Клиент API

`lib/api-client.ts` оборачивает `openapi-fetch`, типизированный по
`@ecobalance/contracts` (генерируется из `openapi.json`). Сессия —
httpOnly cookie, передаётся браузером автоматически
(`credentials: "include"`); фронтенд никогда не читает и не хранит
токен сам.

Два эндпоинта (`GET /calculations/{id}`, `PATCH /calculations/{id}`)
возвращают на бэкенде `dict[str, Any]`, а не типизированную
Pydantic-модель — поэтому для них в `lib/types.ts` заведены ручные
интерфейсы (`CalculationDetail`, `PatchResult`), а не сгенерированные
типы. Это сознательный пробел, не ошибка — см.
`docs/open-questions.md`.

## Правила компонентов

- Текст — только из `lib/dictionaries/ru.ts`, не литералом в JSX
  (кроме меток, которые уже являются данными — названия продуктов,
  регионов и т.п., приходящих из API).
- Формы — React Hook Form + Zod (`login`, `register`); сложные
  многошаговые формы (мастер расчёта) используют локальный `useState`
  с явным маппингом в payload API, а не Zod-схему на весь шаг —
  Decimal-поля бэкенда принимают строки, и это самый прямой путь.
- Данные — TanStack Query (`useQuery`/`useMutation`), без ручного
  `useEffect` + `fetch` кроме единственного случая (скачивание файла
  отчёта — `fetch` + `Blob`, т.к. это не JSON-ресурс).

## Дизайн-токены и темы

См. [design/index.md](../design/index.md).
