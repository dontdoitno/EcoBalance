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
| Маршрут производства | `CalculationInput.route_id` → `Route.name`; при нескольких маршрутах — `CalculationInput.processes[].route_id`, усреднено по `output_share_pct` (см. cbam.md) |
| Отчётный период | не хранится как отдельное поле в этой версии — `Calculation.created_at`/`finalized_at` используются как приближение; специализированное поле `period_start`/`period_end` из раздела 0 формы (§5.3) не реализовано, см. `docs/open-questions.md` |
| Прямые выбросы (Scope 1) | `CalculationResult.scope1_kg_co2_per_unit` |
| Косвенные выбросы (Scope 2) | `CalculationResult.scope2_kg_co2_per_unit` |
| Выбросы прекурсоров (построчно) | `raw_materials[]` в `CalculationInput.data`, разложено по строкам в `generator._precursor_rows`; агрегат — `BreakdownItem` с `category="upstream"`. Зануляется для «простых товаров» (`Product.requires_precursor_accounting=False`) |
| Удельные встроенные выбросы | `CalculationResult.cbam_embedded_kg_co2_per_unit` |
| Методология и источники коэффициентов | `EmissionFactor.source`/`year`/`is_demo` (снимок `ecobalance_core.reference` в БД) |
| Качество данных и верификация | `CalculationResult.data_quality_score`, `data_quality_flags` |
| Оценка стоимости (факт vs default) | параметры запроса отчёта + расчёт в `app/reports/generator.py::render_cbam_pdf` |
| Дисклеймер демо-коэффициентов | флаг `demo_factors` в `data_quality_flags`, показывается как явный баннер в отчёте и в UI |

## Шаблон по образцу cbamtrack.com (1:1)

По запросу пользователя CBAM-отчёт (PDF/XLSX/веб-страница) теперь включает
отдельную таблицу из 12 полей, повторяющую структуру примера
cbamtrack.com/cbam-reporting-template поле-в-поле:

| Поле (как на cbamtrack.com) | Источник в системе |
|---|---|
| Declarant Name | `Company.name` |
| EORI Number | `Company.eori` (новое опциональное поле профиля компании) |
| CN Code | `Product.cn_code` |
| Product Description | `Product.name` |
| Country of Origin | `Company.country` (новое опциональное поле профиля компании) |
| Quantity (tonnes) | `CalculationInput.actual_output_t` (новое поле шага 1 визарда, по умолчанию 1) |
| Direct Emissions (tCO₂e) | `scope1_kg_co2_per_unit × actual_output_t ÷ 1000` |
| Indirect Emissions (tCO₂e) | `scope2_kg_co2_per_unit × actual_output_t ÷ 1000` |
| Total Embedded Emissions (tCO₂e) | `cbam_embedded_kg_co2_per_unit × actual_output_t ÷ 1000` |
| Emission Factor Source | "Default values (demo/unverified)" если есть флаг `demo_factors`, иначе "Verified (EU CBAM Guidance No.3 / IPCC 2006 GL)" |
| Carbon Price Paid | `CalculationInput.carbon_price_paid_eur_per_t` (новое опциональное поле шага 1 визарда — цена, уплаченная декларантом в стране происхождения, не оценочная цена EU ETS) |
| Free Allocation | `reference.get_free_allocation_pct(year)` — официальный график фазаута бесплатных квот EU ETS по CBAM Regulation (EU) 2023/956, Art. 31a, для года завершения расчёта |

Реализация: `app/reports/generator.py::_cbamtrack_table` (общая для PDF и
XLSX), секция "Report Template (cbamtrack.com format)" в
`cbam_report.html.jinja2`, лист "Шаблон отчёта" в XLSX.

## Не реализовано в этой версии

- Отдельное хранение отчётного периода (начало/конец) и цели расчёта
  (раздел 0 формы) как структурированных полей `Calculation` — сейчас
  это часть `CalculationInput.data` (JSONB), не выделено в колонки.
- Множественные прекурсоры с собственными CN-кодами (упрощённо — все
  `raw_materials` расчёта считаются прекурсорами для embedded emissions,
  без собственного CN-кода на каждый прекурсор).
- EORI, страна происхождения и уплаченная цена CO₂ теперь собираются
  (`Company.eori`/`Company.country`, `CalculationInput.carbon_price_paid_eur_per_t`
  — см. «Шаблон по образцу cbamtrack.com» выше), но это необязательные
  поля, заполняемые пользователем вручную, а не верифицированные данные
  из первичного источника — при пустом значении отчёт показывает «—».
