"""Allocation between co-products (PROMPT_CLAUDE_CODE.md §5.1).

Four methods: mass, energy content, economic value, system expansion. The
first three return a factor in [0, 1] that scales total site emissions
down to the main product's share. System expansion instead credits the
main product for the emissions of a substituted product it displaces,
without allocating anything to co-products.

A rationale string is mandatory whenever co-products are present — this is
enforced at the model level (`AllocationInput.rationale`, `CalculationInput`
validators), not here; this module just computes the factor.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from ecobalance_core.models import AllocationInput, CalculationInput, CoProductInput


class AllocationError(ValueError):
    pass


@dataclass(frozen=True)
class AllocationResult:
    factor: Decimal
    credit_kg_co2_per_unit: Decimal


def _mass_factor(main_output_t: Decimal, co_products: list[CoProductInput]) -> Decimal:
    co_products_mass = sum((cp.quantity_t_per_year for cp in co_products), start=Decimal("0"))
    total = main_output_t + co_products_mass
    if total <= 0:
        raise AllocationError(
            "total mass (main + co-products) must be positive for mass allocation"
        )
    return main_output_t / total


def _energy_factor(
    main_output_t: Decimal,
    main_energy_content: Decimal | None,
    co_products: list[CoProductInput],
) -> Decimal:
    if main_energy_content is None:
        raise AllocationError("energy allocation requires main_product_energy_content_gj_per_t")
    main_energy = main_output_t * main_energy_content
    co_products_energy = Decimal("0")
    for cp in co_products:
        if cp.energy_content_gj_per_t is None:
            raise AllocationError(f"co-product {cp.name!r} is missing energy_content_gj_per_t")
        co_products_energy += cp.quantity_t_per_year * cp.energy_content_gj_per_t
    total = main_energy + co_products_energy
    if total <= 0:
        raise AllocationError("total energy content must be positive for energy allocation")
    return main_energy / total


def _economic_factor(
    main_output_t: Decimal,
    main_economic_value: Decimal | None,
    co_products: list[CoProductInput],
) -> Decimal:
    if main_economic_value is None:
        raise AllocationError("economic allocation requires main_product_economic_value_per_t")
    main_value = main_output_t * main_economic_value
    co_products_value = Decimal("0")
    for cp in co_products:
        if cp.economic_value_per_t is None:
            raise AllocationError(f"co-product {cp.name!r} is missing economic_value_per_t")
        co_products_value += cp.quantity_t_per_year * cp.economic_value_per_t
    total = main_value + co_products_value
    if total <= 0:
        raise AllocationError("total economic value must be positive for economic allocation")
    return main_value / total


def allocate(calculation_input: CalculationInput) -> AllocationResult:
    """Return the allocation factor and system-expansion credit, per unit of
    the main product's functional unit.
    """
    co_products = calculation_input.co_products
    allocation: AllocationInput | None = calculation_input.allocation

    if not co_products or allocation is None:
        return AllocationResult(factor=Decimal("1"), credit_kg_co2_per_unit=Decimal("0"))

    main_output_t = calculation_input.actual_output_t

    if allocation.method == "mass":
        factor = _mass_factor(main_output_t, co_products)
        return AllocationResult(factor=factor, credit_kg_co2_per_unit=Decimal("0"))

    if allocation.method == "energy":
        factor = _energy_factor(
            main_output_t, calculation_input.main_product_energy_content_gj_per_t, co_products
        )
        return AllocationResult(factor=factor, credit_kg_co2_per_unit=Decimal("0"))

    if allocation.method == "economic":
        factor = _economic_factor(
            main_output_t, calculation_input.main_product_economic_value_per_t, co_products
        )
        return AllocationResult(factor=factor, credit_kg_co2_per_unit=Decimal("0"))

    if allocation.method == "system_expansion":
        substituted_quantity = allocation.substituted_quantity_t_per_year or Decimal("0")
        substituted_ef = allocation.substituted_ef_kg_co2_per_t or Decimal("0")
        credit_total = substituted_quantity * substituted_ef
        credit_per_unit = credit_total / main_output_t if main_output_t > 0 else Decimal("0")
        return AllocationResult(factor=Decimal("1"), credit_kg_co2_per_unit=credit_per_unit)

    raise AllocationError(f"Unknown allocation method: {allocation.method!r}")
