from decimal import Decimal

import pytest

from ecobalance_core.allocation import AllocationError, allocate
from ecobalance_core.models import AllocationInput, CalculationInput, CoProductInput


def _base_input(**overrides: object) -> CalculationInput:
    defaults: dict[str, object] = {"product_id": "ammonia", "actual_output_t": Decimal("10")}
    defaults.update(overrides)
    return CalculationInput(**defaults)  # type: ignore[arg-type]


def test_no_co_products_gives_full_allocation() -> None:
    result = allocate(_base_input())
    assert result.factor == Decimal("1")
    assert result.credit_kg_co2_per_unit == Decimal("0")


def test_mass_allocation() -> None:
    calculation_input = _base_input(
        co_products=[CoProductInput(name="by-product", quantity_t_per_year=Decimal("5"))],
        allocation=AllocationInput(method="mass", rationale="by mass, per site records"),
    )
    result = allocate(calculation_input)
    # main 10t vs co-product 5t -> 10/15
    assert result.factor == Decimal("10") / Decimal("15")
    assert Decimal("0") <= result.factor <= Decimal("1")


def test_energy_allocation_requires_energy_content() -> None:
    calculation_input = _base_input(
        co_products=[
            CoProductInput(
                name="by-product",
                quantity_t_per_year=Decimal("5"),
                energy_content_gj_per_t=Decimal("10"),
            )
        ],
        allocation=AllocationInput(method="energy", rationale="by energy content"),
    )
    with pytest.raises(AllocationError):
        allocate(calculation_input)


def test_energy_allocation() -> None:
    calculation_input = _base_input(
        main_product_energy_content_gj_per_t=Decimal("20"),
        co_products=[
            CoProductInput(
                name="by-product",
                quantity_t_per_year=Decimal("5"),
                energy_content_gj_per_t=Decimal("10"),
            )
        ],
        allocation=AllocationInput(method="energy", rationale="by energy content"),
    )
    result = allocate(calculation_input)
    # main: 10*20=200, co-product: 5*10=50, total=250 -> 200/250 = 0.8
    assert result.factor == Decimal("0.8")


def test_system_expansion_credits_without_allocating() -> None:
    calculation_input = _base_input(
        co_products=[CoProductInput(name="by-product", quantity_t_per_year=Decimal("5"))],
        allocation=AllocationInput(
            method="system_expansion",
            rationale="substitutes conventional product X",
            substituted_quantity_t_per_year=Decimal("5"),
            substituted_ef_kg_co2_per_t=Decimal("100"),
        ),
    )
    result = allocate(calculation_input)
    assert result.factor == Decimal("1")
    # 5t * 100 kg/t = 500 kg total credit / 10t main output = 50 kg/unit
    assert result.credit_kg_co2_per_unit == Decimal("50")


def test_rationale_is_required_with_co_products() -> None:
    with pytest.raises(ValueError):
        _base_input(
            co_products=[CoProductInput(name="by-product", quantity_t_per_year=Decimal("5"))]
        )
