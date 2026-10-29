from decimal import Decimal

import pytest

from ecobalance_core.allocation import AllocationError, allocate
from ecobalance_core.models import AllocationInput, CalculationInput, CoProductInput


def test_economic_allocation() -> None:
    calculation_input = CalculationInput(
        product_id="ammonia",
        actual_output_t=Decimal("10"),
        main_product_economic_value_per_t=Decimal("300"),
        co_products=[
            CoProductInput(
                name="by-product",
                quantity_t_per_year=Decimal("5"),
                economic_value_per_t=Decimal("100"),
            )
        ],
        allocation=AllocationInput(method="economic", rationale="by market value"),
    )
    result = allocate(calculation_input)
    # main: 10*300=3000, co: 5*100=500, total=3500 -> 3000/3500
    assert result.factor == Decimal("3000") / Decimal("3500")


def test_economic_allocation_requires_main_value() -> None:
    calculation_input = CalculationInput(
        product_id="ammonia",
        actual_output_t=Decimal("10"),
        co_products=[
            CoProductInput(
                name="by-product",
                quantity_t_per_year=Decimal("5"),
                economic_value_per_t=Decimal("100"),
            )
        ],
        allocation=AllocationInput(method="economic", rationale="by market value"),
    )
    with pytest.raises(AllocationError):
        allocate(calculation_input)


def test_economic_allocation_requires_co_product_value() -> None:
    calculation_input = CalculationInput(
        product_id="ammonia",
        actual_output_t=Decimal("10"),
        main_product_economic_value_per_t=Decimal("300"),
        co_products=[CoProductInput(name="by-product", quantity_t_per_year=Decimal("5"))],
        allocation=AllocationInput(method="economic", rationale="by market value"),
    )
    with pytest.raises(AllocationError):
        allocate(calculation_input)
