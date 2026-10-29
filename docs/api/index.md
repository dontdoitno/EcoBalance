# API

FastAPI-приложение в `apps/api/app/`. Эндпоинты сгруппированы по
роутерам: `auth`, `companies`, `installations`, `calculations`,
`calculations/{id}/scenarios`, `reference`, `reports`. Полная
спецификация ниже сгенерирована из работающего приложения
(`scripts/export_openapi.py` → `docs/api/openapi.json`;
`packages/contracts` генерирует из того же файла TS-типы для
фронтенда).

## Обзор

| Группа | Эндпоинты | Аутентификация |
|---|---|---|
| Auth | `POST /auth/register`, `/login`, `/logout`, `/refresh`, `GET /auth/me` | нет (кроме `/me`) |
| Companies | `GET`/`PATCH /companies/me` | требуется |
| Installations | `GET`/`POST /installations`, `PATCH /installations/{id}` | требуется |
| Calculations | `GET`/`POST /calculations`, `GET`/`PATCH /calculations/{id}`, `POST .../calculate`, `POST .../finalize` | требуется, изоляция по компании |
| Scenarios | `GET`/`POST /calculations/{id}/scenarios` | требуется, изоляция по компании |
| Reference | `GET /reference/{products,routes,fuels,raw-materials,regions,transport-modes,waste-treatments,measures}` | нет (публичный справочник) |
| Reports | `GET /reports/{calculation_id}?report_type=pcf\|cbam\|scenario&report_format=pdf\|xlsx\|json` | требуется, изоляция по компании |

Подробности аутентификации и rate limiting — см.
[architecture/auth-security.md](../architecture/auth-security.md).

## Интерактивная спецификация

<swagger-ui src="openapi.json"/>
