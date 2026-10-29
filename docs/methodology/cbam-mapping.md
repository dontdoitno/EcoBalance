# CBAM: соответствие полей отчёта и источников данных

**Статус: структурный каркас, ориентированный на Implementing Regulation
(EU) 2025/2547, упомянутый в исходном техническом задании как основа
формата отчёта коммуникации данных оператора установки. Номер акта и
структура полей ниже требуют верификации по первоисточнику перед
использованием в реальной декларации — здесь они не проверялись
независимо.**

## Поля отчёта → источник данных

| Поле отчёта CBAM | Источник в системе |
|---|---|
| Наименование оператора/компании | `Company.name` |
| Товар | `ReferenceItem` (kind=product) → `Product.name` |
| CN-код | `Product.cn_code` |
| Маршрут производства | `CalculationInput.route_id` → `Route.name` |
| Отчётный период | не хранится как отдельное поле в этой версии — `Calculation.created_at`/`finalized_at` используются как приближение; специализированное поле `period_start`/`period_end` из раздела 0 формы (§5.3) не реализовано, см. `docs/open-questions.md` |
| Прямые выбросы (Scope 1) | `CalculationResult.scope1_kg_co2_per_unit` |
| Косвенные выбросы (Scope 2) | `CalculationResult.scope2_kg_co2_per_unit` |
| Выбросы прекурсоров | `BreakdownItem` с `category="upstream"` |
| Удельные встроенные выбросы | `CalculationResult.cbam_embedded_kg_co2_per_unit` |
| Методология и источники коэффициентов | `EmissionFactor.source`/`year`/`is_demo` (снимок `ecobalance_core.reference` в БД) |
| Качество данных и верификация | `CalculationResult.data_quality_score`, `data_quality_flags` |
| Оценка стоимости (факт vs default) | параметры запроса отчёта + расчёт в `app/reports/generator.py::render_cbam_pdf` |
| Дисклеймер демо-коэффициентов | флаг `demo_factors` в `data_quality_flags`, показывается как явный баннер в отчёте и в UI |

## Не реализовано в этой версии

- Отдельное хранение отчётного периода (начало/конец) и цели расчёта
  (раздел 0 формы) как структурированных полей `Calculation` — сейчас
  это часть `CalculationInput.data` (JSONB), не выделено в колонки.
- Множественные прекурсоры с собственными CN-кодами (упрощённо — все
  `raw_materials` расчёта считаются прекурсорами для embedded emissions).
