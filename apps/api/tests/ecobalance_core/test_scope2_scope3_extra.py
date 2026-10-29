from decimal import Decimal

import pytest

from ecobalance_core.engine import calculate
from ecobalance_core.models import (
    CalculationInput,
    HeatInput,
    WasteStreamInput,
)
from ecobalance_core.scope2 import calculate as scope2_calculate


def test_heat_from_own_boiler() -> None:
    calculation_input = CalculationInput(
        product_id="ammonia",
        heat=HeatInput(
            consumption_gj_per_unit=Decimal("2"),
            source="own_boiler",
            boiler_fuel_id="natural_gas",
            boiler_efficiency_pct=Decimal("80"),
        ),
    )
    result = calculate(calculation_input)
    # EF = fuel_ef_per_gj / efficiency = 56.1 / 0.8 = 70.125; heat = 2 * 70.125 = 140.25
    assert result.scope2_kg_co2_per_unit == Decimal("140.25")


def test_heat_requires_override_or_boiler_fuel() -> None:
    calculation_input = CalculationInput(
        product_id="ammonia",
        heat=HeatInput(consumption_gj_per_unit=Decimal("1"), source="purchased_steam"),
    )
    with pytest.raises(ValueError):
        scope2_calculate(calculation_input)


def test_waste_with_treated_wastewater() -> None:
    calculation_input = CalculationInput(
        product_id="ammonia",
        waste=[
            WasteStreamInput(
                kind="liquid",
                quantity_t_per_unit=Decimal("0.1"),
                treatment_id="water_discharge",
                wastewater_treated=True,
                wastewater_m3_per_unit=Decimal("2"),
            )
        ],
    )
    result = calculate(calculation_input)
    # waste = 0.1*20 + 2*0.3 = 2 + 0.6 = 2.6
    assert result.scope3_kg_co2_per_unit == Decimal("2.60")


def test_electricity_requires_region_or_override() -> None:
    with pytest.raises(ValueError):
        CalculationInput(
            product_id="ammonia",
            electricity={"consumption_mwh_per_unit": "0.5"},
        )
