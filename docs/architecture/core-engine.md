# Контракт расчётного ядра

`apps/api/ecobalance_core/` — чистый Python-пакет, **без** зависимости
от FastAPI, SQLAlchemy или сети. Любой вызывающий код (API, тесты,
скрипт сидирования, будущий CLI) работает с ним одинаково:

```python
from ecobalance_core.engine import calculate
from ecobalance_core.models import CalculationInput

result = calculate(CalculationInput(product_id="ammonia", ...))
```

## Гарантии

- **Детерминированность.** Один и тот же `CalculationInput` всегда даёт
  один и тот же `CalculationResult` — никаких случайных чисел, часов
  или внешних вызовов внутри пакета.
- **Типизация.** `mypy --strict` проходит на весь пакет без `# type:
  ignore` без комментария (CI: `apps/api` job).
- **Единицы.** Конвертации — явные функции в `units.py`; несовпадение
  единиц (например, отсутствие НТС при переводе объёма в энергию)
  поднимает `UnitError`, не тихо приводится.
- **Воспроизводимость.** `Calculation.factor_version` в БД фиксирует,
  на какой версии справочника (`ecobalance_core.reference`) сделан
  расчёт — при появлении второй версии справочника старые расчёты
  останутся воспроизводимыми (см. ограничение в
  [emission-factors.md](../methodology/emission-factors.md): сейчас
  живёт только одна версия).

## Границы модуля

| Вход | Выход |
|---|---|
| `CalculationInput` (Pydantic, `Decimal`) | `CalculationResult` (Pydantic, `Decimal`) |
| `measures.apply(id, input, assumptions)` | новый `CalculationInput` (копия с мутацией) |
| `scenario.run_scenario(input, measure_ids, overrides)` | `ScenarioResult` (dataclass: `baseline`, `scenario`, `delta_*`) |

Округление до 2 знаков происходит **только** в `engine.calculate` на
выходе (`_round`) — внутренние промежуточные величины (`scope1.py`,
`scope2.py`, `scope3.py`, `allocation.py`) остаются неусечённым
`Decimal`.

## Ошибки

| Исключение | Когда |
|---|---|
| `pydantic.ValidationError` | невалидный `CalculationInput` (например, нет `rationale` при аллокации с сопряжёнными продуктами) |
| `ecobalance_core.units.UnitError` | отсутствует НТС при конвертации объёма/массы в энергию |
| `ecobalance_core.allocation.AllocationError` | метод аллокации требует поле, которого нет (например, `economic` без экономической стоимости) |
| `KeyError` | неизвестный `fuel_id`/`material_id`/`region_id`/`mode_id`/`treatment_id`/`product_id`/мера — справочник не содержит такой записи |

API-слой перехватывает `pydantic.ValidationError` и возвращает `422` с
деталями; `KeyError` на уровне `/reference/*` и расчёта пока не
оборачивается в отдельный пользовательский код ошибки (см.
`docs/open-questions.md`).
