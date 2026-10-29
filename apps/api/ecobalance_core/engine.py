"""The calculation engine entry point:

    PCF = (E_direct + E_indirect + E_upstream + E_transport + E_waste − E_credits) / M_product

All component terms are already expressed per functional unit (M_product
== 1 functional unit), so the division is implicit. `cbam_embedded`
excludes finished-product transport and waste, per §5.2 — only direct,
indirect, and upstream-precursor emissions count toward embedded
emissions. In this MVP's demo catalog every raw material on a
CBAM-applicable product is treated as a precursor.
"""

from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal

from ecobalance_core import hotspots, reference, scope1, scope2, scope3
from ecobalance_core.allocation import allocate
from ecobalance_core.models import BreakdownItem, CalculationInput, CalculationResult

_ROUND_2DP = Decimal("0.01")


def _round(value: Decimal) -> Decimal:
    return value.quantize(_ROUND_2DP, rounding=ROUND_HALF_UP)


def calculate(calculation_input: CalculationInput) -> CalculationResult:
    s1 = scope1.calculate(calculation_input)
    s2 = scope2.calculate(calculation_input)
    s3 = scope3.calculate(calculation_input)

    allocation_result = allocate(calculation_input)

    gross = s1.total_kg_co2_per_unit + s2.total_kg_co2_per_unit + s3.total_kg_co2_per_unit
    allocated = gross * allocation_result.factor
    pcf_full = allocated - allocation_result.credit_kg_co2_per_unit

    embedded_gross = (
        s1.total_kg_co2_per_unit + s2.total_kg_co2_per_unit + s3.upstream_kg_co2_per_unit
    )
    embedded_allocated = embedded_gross * allocation_result.factor

    product = reference.get_product(calculation_input.product_id)
    cbam_applicable = product.cbam_applicable
    cbam_embedded = _round(embedded_allocated) if cbam_applicable else None
    cbam_not_applicable_reason = (
        None
        if cbam_applicable
        else (
            f"CBAM не применим для продукта «{product.name}» — он не входит в категории "
            "товаров CBAM (цемент, удобрения, железо и сталь, алюминий, водород, "
            "электроэнергия). Сформируйте PCF-отчёт (ISO 14067) вместо отчёта CBAM."
        )
    )

    categories = [
        ("upstream", "Сырьё", "Scope 3", s3.upstream_kg_co2_per_unit),
        ("energy", "Энергия", "Scope 2", s2.total_kg_co2_per_unit),
        ("process", "Технологические и прямые выбросы", "Scope 1", s1.total_kg_co2_per_unit),
        ("transport", "Транспорт", "Scope 3", s3.transport_kg_co2_per_unit),
        ("waste", "Отходы", "Scope 3", s3.waste_kg_co2_per_unit),
    ]

    breakdown: list[BreakdownItem] = []
    for category, label, scope_label, value in categories:
        if value == 0:
            continue
        percentage = (value / pcf_full * Decimal(100)) if pcf_full != 0 else Decimal("0")
        breakdown.append(
            BreakdownItem(
                category=category,  # type: ignore[arg-type]
                label=label,
                scope=scope_label,  # type: ignore[arg-type]
                value_kg_co2_per_unit=_round(value),
                percentage=_round(percentage),
            )
        )

    hotspot_list = hotspots.rate_breakdown(breakdown)

    scope3_pct = (
        (s3.total_kg_co2_per_unit / pcf_full * Decimal(100)) if pcf_full != 0 else Decimal("0")
    )
    scope3_hint = hotspots.scope3_chemical_hint(scope3_pct)

    data_quality_score, data_quality_flags = hotspots.data_quality_flags(
        calculation_input.data_quality, is_demo=True
    )
    if scope3_hint is not None:
        data_quality_flags = [*data_quality_flags, scope3_hint]

    return CalculationResult(
        pcf_full_kg_co2_per_unit=_round(pcf_full),
        cbam_embedded_kg_co2_per_unit=cbam_embedded,
        cbam_applicable=cbam_applicable,
        cbam_not_applicable_reason=cbam_not_applicable_reason,
        scope1_kg_co2_per_unit=_round(s1.total_kg_co2_per_unit),
        scope2_kg_co2_per_unit=_round(s2.total_kg_co2_per_unit),
        scope3_kg_co2_per_unit=_round(s3.total_kg_co2_per_unit),
        breakdown=breakdown,
        hotspots=hotspot_list,
        allocation_factor=_round(allocation_result.factor),
        allocation_credit_kg_co2_per_unit=_round(allocation_result.credit_kg_co2_per_unit),
        data_quality_score=_round(data_quality_score) if data_quality_score is not None else None,
        data_quality_flags=data_quality_flags,
        gwp_set=calculation_input.gwp_set,
        boundary=calculation_input.boundary,
        functional_unit=calculation_input.functional_unit,
    )
