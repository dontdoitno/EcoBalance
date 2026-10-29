# Формулы

Реализация: `apps/api/ecobalance_core/`. Внутренняя арифметика — `Decimal`
(см. [ADR-0002](../architecture/adr/0002-decimal.md)); округление до 2
знаков происходит только на выходе (`engine.calculate`).

## Общая формула PCF

$$
PCF = \frac{E_{direct} + E_{indirect} + E_{upstream} + E_{transport} + E_{waste} - E_{credits}}{M_{product}}
$$

Функциональная единица по умолчанию — 1 т продукта (`M_product = 1`), поэтому
в коде каждая составляющая уже выражена «на функциональную единицу», и
деление опускается (`engine.py`).

## Scope 1 — прямые выбросы (`scope1.py`)

$$
E_{direct} = \sum_i (Q_i \times NCV_i \times EF_i) + E_{process} - E_{captured} + E_{flare} + E_{fugitive} \cdot GWP_{CH_4} + E_{N_2O} \cdot GWP_{N_2O}
$$

- `Q_i × NCV_i` переводится в энергию (ГДж) через `units.thousand_m3_to_gj`
  (газовое топливо) или `units.mass_to_gj` (твёрдое/жидкое топливо).
- `E_process`, `E_flare`, `E_fugitive`, `E_captured`, `E_N₂O` — **годовые**
  величины (т/год), которые делятся на `actual_output_t`, чтобы привести к
  функциональной единице — так в реальности репортятся технологические
  выбросы площадки.
- `GWP_CH₄` / `GWP_N₂O` берутся из `gwp.py` по выбору `AR5`/`AR6`.
- `E_captured` **вычитается** и никогда не делает след отрицательным по
  построению (property-тест `test_capturing_more_co2_never_increases_footprint`).

## Scope 2 — энергия (`scope2.py`)

$$
E_{indirect} = Q_{el} \times EF_{el} + Q_{heat} \times EF_{heat}
$$

`EF_el` берётся из региона энергосистемы (`reference.REGIONS`) либо из
явного override (`ElectricityInput.ef_override_kg_co2_per_mwh`, для
market-based учёта). `EF_heat` для собственной котельной выводится из
EF топлива котельной, скорректированного на КПД: `EF_heat = EF_fuel / efficiency`.

## Scope 3 — сырьё, транспорт, отходы (`scope3.py`)

$$
E_{upstream} = \sum_j (M_j \times EF_j) \qquad
E_{transport} = \sum_k (M_k \times D_k \times EF_{mode,k}) \qquad
E_{waste} = \sum_l (M_l \times EF_{treatment,l})
$$

Сточные воды добавляют `m³ × 0.3 кг CO₂/м³` (`WASTEWATER_TREATMENT_EF_KG_CO2_PER_M3`) сверху, если
`wastewater_treated=true`.

## Аллокация (`allocation.py`)

Четыре метода — подробности в [allocation.md](allocation.md). Результат —
множитель `factor ∈ [0, 1]`, которым умножается `E_direct + E_indirect + E_upstream + E_transport + E_waste`
перед вычитанием `E_credits` (только для `system_expansion`, где `factor = 1`
и кредит считается отдельно).

## CBAM embedded vs PCF full (`engine.py`)

```
cbam_embedded = (E_direct + E_indirect + E_upstream) × allocation.factor
pcf_full      = (E_direct + E_indirect + E_upstream + E_transport + E_waste) × allocation.factor − E_credits
```

`cbam_embedded` вычисляется только для CBAM-применимых продуктов (см.
[cbam.md](cbam.md)); для остальных поле `None`, а `cbam_not_applicable_reason`
объясняет причину и предлагает PCF-отчёт.

## Golden-кейсы

Три ручных расчёта, идентичные `tests/ecobalance_core/test_golden_cases.py` —
при изменении формул обновляются оба файла синхронно.

### Аммиак, паровой риформинг (SMR)

| Составляющая | Расчёт | Значение |
|---|---|---|
| Сжигание топлива (Scope 1) | 1 тыс. м³ × 34 000 МДж/тыс. м³ ÷ 1000 × 56,1 кг CO₂/ГДж | 1907,4 кг |
| Сырьё (Scope 3) | 0,6 т/т × 2200 кг CO₂/т | 1320,0 кг |
| Электроэнергия (Scope 2) | 0,2 МВт·ч/т × 350 кг CO₂/МВт·ч | 70,0 кг |
| Транспорт (Scope 3) | 1 т × 500 км × 0,162 кг CO₂/т·км | 81,0 кг |
| **PCF full** | сумма | **3378,4 кг CO₂-экв./т** |
| **CBAM embedded** | без транспорта | **3297,4 кг CO₂-экв./т** |

### ПВХ, суспензионная полимеризация

| Составляющая | Расчёт | Значение |
|---|---|---|
| Этилен (Scope 3) | 0,45 т/т × 1500 кг CO₂/т | 675,0 кг |
| Хлор (Scope 3) | 0,58 т/т × 1100 кг CO₂/т | 638,0 кг |
| Электроэнергия (Scope 2, Урал) | 0,35 МВт·ч/т × 580 кг CO₂/МВт·ч | 203,0 кг |
| **PCF full** | сумма | **1516,0 кг CO₂-экв./т** |
| **CBAM** | не применим (ПВХ не в категориях CBAM) | — |

### Мочевина с использованием уловленного CO₂

Выпуск 100 т/год; технологические выбросы 200 т/год, уловлено 150 т/год.

| Составляющая | Расчёт | Значение |
|---|---|---|
| Технологические (Scope 1) | (200 − 150) т/год × 1000 ÷ 100 т/год | 500,0 кг/т |
| Аммиак-сырьё (Scope 3) | 0,57 т/т × 2400 кг CO₂/т | 1368,0 кг |
| Электроэнергия (Scope 2) | 0,05 МВт·ч/т × 350 кг CO₂/МВт·ч | 17,5 кг |
| **PCF full = CBAM embedded** | сумма (нет транспорта/отходов) | **1885,5 кг CO₂-экв./т** |

Без улавливания (captured = 0) след был бы выше — property-тест проверяет
это на случайных входных данных, не только на этом кейсе.
