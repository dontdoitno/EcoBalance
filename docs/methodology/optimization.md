# Оптимизация: сценарии и каталог мер

Реализация: `ecobalance_core/measures.py` + `ecobalance_core/scenario.py`,
метаданные — `apps/api/config/measures.yml`.

## Принцип: пересчёт модели, не процент от потолка

Известный дефект старого прототипа — эффект меры задавался магической
формулой вроде `15 + вклад/2`, а комбинация мер — произведением с
«коэффициентом синергии 0.85». В EcoBalance:

1. Каждая мера имеет **предикат применимости** (`_is_*_applicable`) и
   **функцию мутации** (`_apply_*`), которая меняет конкретные поля
   `CalculationInput` — не результат.
2. `run_scenario` клонирует входные данные, последовательно применяет
   мутации всех выбранных мер к одной копии, затем вызывает
   `engine.calculate` на мутированных данных.
3. Эффект каждой меры и их комбинации — это разница между двумя
   полноценными прогонами ядра, а не арифметика над процентами.

## Каталог мер (демо)

| id | Scope | Применимость (предикат) | Мутация |
|---|---|---|---|
| `renewable_electricity` | Scope 2 | `electricity.consumption_mwh_per_unit > 0.3` | `ef_override_kg_co2_per_mwh = assumptions.target_ef_kg_co2_per_mwh`, `ef_type = "market_based"` |
| `energy_efficiency` | Scope 1-2 | `electricity.consumption_mwh_per_unit > 0.5` | `consumption_mwh_per_unit *= (1 − reduction_ratio)` |
| `raw_material_switch` | Scope 3 | есть сырьё из `{natural_gas_feedstock, naphtha_feedstock, coal_feedstock}` | часть массы (`switch_ratio`) переносится на `target_material_id` (по умолчанию `biomass_feedstock`) как новая строка сырья |
| `logistics_optimization` | Scope 3 | есть хотя бы одно транспортное плечо | плечи с EF выше, чем у `target_mode_id` (по умолчанию ж/д), переключаются на него |
| `carbon_capture` | Scope 1 | есть `process` с `co2_process + flare + fugitive_ch4 > 0` | `captured_co2_t_per_year += capture_ratio × co2_process_t_per_year`; `fugitive_ch4_t_per_year *= (1 − capture_ratio)` |

Качественные метаданные (название, сложность, окупаемость, стандарты,
побочные эффекты) и **редактируемые допущения по умолчанию**
(`default_assumptions`) — в `config/measures.yml`. Пользователь может
переопределить допущения на запрос (`ScenarioCreate.assumption_overrides`
в API).

## Комбинация мер

Меры применяются **последовательно** к одному и тому же входу — если
две меры трогают одно поле (например, обе меняют транспортную эмиссию),
вторая мутация видит уже изменённые данные первой. Никакого отдельного
«коэффициента синергии» не вводится — пересчёт модели сам по себе даёт
корректный совместный эффект.

## Что показывается пользователю (`/calculations/{id}/scenarios`)

PCF до/после, дельта по `pcf_full`, дельта `cbam_embedded` (если
применимо), список применённых мер с их метаданными. Дельта по каждому
Scope отдельно и изменение оценки стоимости CBAM в сценарии — доступны
через `baseline`/`scenario` полные объекты `CalculationResult` в ответе
API, но в текущем UI показана только сводная дельта по `pcf_full` и
`cbam_embedded`, не полная таблица по Scope — см. открытые пункты.
