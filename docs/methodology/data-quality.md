# Качество данных

Реализация: `ecobalance_core.models.DataQualityInput` (вход) +
`ecobalance_core.hotspots.data_quality_flags` (оценка).

## Вход (опциональный)

| Поле | Смысл | По умолчанию |
|---|---|---|
| `primary_data_share_pct` | доля первичных (измеренных) данных | 100% |
| `uncertainty_pct` | заявленная неопределённость | 0% |
| `verified_third_party` | верифицировано третьей стороной | `False` |
| `verifier` | кто верифицировал | — |

## Оценка и флаги

Пороги — в `apps/api/config/hotspots.yml`, не в коде:

```yaml
quality_flags:
  primary_data_share_min_pct: 50
  uncertainty_max_pct: 20
```

- Доля первичных данных ниже порога → флаг `low_primary_data_share`.
- Неопределённость выше порога → флаг `high_uncertainty`.
- Коэффициент помечен `is_demo=true` (в этой версии — **все**
  коэффициенты демонстрационные) → флаг `demo_factors`, всегда
  присутствует, показывается как явный баннер в UI и в отчётах.
- `data_quality_score = clamp(primary_data_share_pct − uncertainty_pct / 2, 0, 100)` —
  простая эвристика, не отраслевой стандарт; возвращается только когда
  `DataQualityInput` передан (иначе `None` — "нет данных о качестве
  данных" не подменяется нулём).

## Не реализовано

Флаг «коэффициент старше 5 лет» (`factor_max_age_years` в конфиге)
определён в конфигурации, но не подключён к реальной проверке возраста
по годам факторов в текущей версии (`EmissionFactor.year` хранится в
БД, но сравнение с текущим годом в `hotspots.py` ещё не реализовано) —
зафиксировано в `docs/open-questions.md`.
