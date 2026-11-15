"""The calculation engine entry point:

    PCF = (E_direct + E_indirect + E_upstream + E_transport + E_waste − E_credits) / M_product

All component terms are already expressed per functional unit (M_product
== 1 functional unit), so the division is implicit. `cbam_embedded`
excludes finished-product transport and waste, per §5.2 — only direct,
indirect, and upstream-precursor emissions count toward embedded
emissions. Precursor emissions are only included for "complex goods"
(`Product.requires_precursor_accounting`); per the 'Simple goods'
definition in EU CBAM Guidance No.3, a simple good is zeroed out here. In
this MVP's demo catalog every raw material on a CBAM-applicable product is
treated as a precursor, and all current CBAM products are complex goods
(fertilisers).

Multi-route calculations (`CalculationInput.processes`): per EU CBAM
Guidance No.3 ("Treatment of Production Routes (Averaging)"), emissions for
one good produced via several routes are averaged, weighted by each
route's share of output. Each route may supply its own total coefficient
(`ef_override_kg_co2_per_unit`); if it doesn't, it falls back to this
calculation's shared base figure (computed once below from the shared
fuels/raw_materials/electricity/etc. inputs — those are not split per
route). This averaging is applied to `cbam_embedded`/`pcf_full` only: there
is no sound way to re-derive a Scope 1/2/3 split for a manually entered
override, so the Scope breakdown always reflects the shared base
calculation, not a per-route split.
"""

from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal

from ecobalance_core import hotspots, reference, scope1, scope2, scope3
from ecobalance_core.allocation import allocate
from ecobalance_core.models import (
    BreakdownItem,
    CalculationInput,
    CalculationResult,
    ProcessResultItem,
)

_ROUND_2DP = Decimal("0.01")


def _round(value: Decimal) -> Decimal:
    return value.quantize(_ROUND_2DP, rounding=ROUND_HALF_UP)


def _weighted_processes(
    calculation_input: CalculationInput, base_embedded: Decimal | None, base_pcf: Decimal
) -> tuple[Decimal | None, Decimal, list[ProcessResultItem]]:
    """Blend `base_embedded`/`base_pcf` across `processes` by output share.

    Returns the (possibly re-weighted) embedded/pcf totals plus the
    per-route breakdown for the report. If there are no extra processes,
    the base totals pass through unchanged and the list is empty.
    """
    processes = calculation_input.processes
    if not processes:
        return base_embedded, base_pcf, []

    total_share = sum((p.output_share_pct for p in processes), start=Decimal("0"))
    if total_share <= 0:
        total_share = Decimal(len(processes))
        shares = [Decimal("1") for _ in processes]
    else:
        shares = [p.output_share_pct for p in processes]

    embedded_sum = Decimal("0")
    pcf_sum = Decimal("0")
    items: list[ProcessResultItem] = []
    for process, share in zip(processes, shares, strict=True):
        weight = share / total_share
        route_embedded = (
            process.ef_override_kg_co2_per_unit
            if process.ef_override_kg_co2_per_unit is not None
            else base_embedded
        )
        route_pcf = (
            process.ef_override_kg_co2_per_unit
            if process.ef_override_kg_co2_per_unit is not None
            else base_pcf
        )
        if route_embedded is not None:
            embedded_sum += route_embedded * weight
        pcf_sum += route_pcf * weight

        route = reference.get_route(process.route_id)
        items.append(
            ProcessResultItem(
                route_id=process.route_id,
                route_name=route.name,
                output_share_pct=_round(weight * Decimal(100)),
                used_override=process.ef_override_kg_co2_per_unit is not None,
                cbam_embedded_kg_co2_per_unit=(
                    _round(route_embedded) if route_embedded is not None else None
                ),
            )
        )

    embedded_total = embedded_sum if base_embedded is not None else None
    return embedded_total, pcf_sum, items


def calculate(calculation_input: CalculationInput) -> CalculationResult:
    s1 = scope1.calculate(calculation_input)
    s2 = scope2.calculate(calculation_input)
    s3 = scope3.calculate(calculation_input)

    allocation_result = allocate(calculation_input)

    product = reference.get_product(calculation_input.product_id)

    upstream_for_cbam = (
        s3.upstream_kg_co2_per_unit if product.requires_precursor_accounting else Decimal("0")
    )

    gross = s1.total_kg_co2_per_unit + s2.total_kg_co2_per_unit + s3.total_kg_co2_per_unit
    allocated = gross * allocation_result.factor
    pcf_full = allocated - allocation_result.credit_kg_co2_per_unit

    embedded_gross = s1.total_kg_co2_per_unit + s2.total_kg_co2_per_unit + upstream_for_cbam
    embedded_allocated = embedded_gross * allocation_result.factor

    cbam_applicable = product.cbam_applicable
    base_cbam_embedded = embedded_allocated if cbam_applicable else None
    cbam_embedded, pcf_full, process_items = _weighted_processes(
        calculation_input, base_cbam_embedded, pcf_full
    )
    cbam_embedded = _round(cbam_embedded) if cbam_embedded is not None else None
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
        processes=process_items,
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
