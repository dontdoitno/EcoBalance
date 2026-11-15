"""Tests for the multi-route averaging (`CalculationInput.processes`) and the
simple/complex good precursor rule added for inner_docs/new_features.md
items 1, 2, and 6.
"""

from __future__ import annotations

from dataclasses import replace
from decimal import Decimal

import pytest

from ecobalance_core import reference
from ecobalance_core.engine import calculate
from ecobalance_core.models import (
    CalculationInput,
    ElectricityInput,
    FuelInput,
    ProcessInput,
    RawMaterialInput,
    TransportLegInput,
)

_AMMONIA_SMR_KWARGS = dict(
    product_id="ammonia",
    actual_output_t=Decimal("1"),
    fuels=[FuelInput(fuel_id="natural_gas", quantity=Decimal("1"), use="fuel")],
    raw_materials=[
        RawMaterialInput(material_id="natural_gas_feedstock", quantity_t_per_unit=Decimal("0.6"))
    ],
    electricity=ElectricityInput(
        consumption_mwh_per_unit=Decimal("0.2"), region_id="pricing_zone_europe_ural"
    ),
    transport=[
        TransportLegInput(
            direction="outbound_product",
            mode_id="truck",
            distance_km=Decimal("500"),
            mass_t_per_unit=Decimal("1"),
        )
    ],
)


def test_single_process_matches_legacy_route_id() -> None:
    """No `processes` entries: behaviour is unchanged from the single-route case."""
    base = CalculationInput(route_id="ammonia__smr", **_AMMONIA_SMR_KWARGS)
    result = calculate(base)
    assert result.cbam_embedded_kg_co2_per_unit == Decimal("3293.89")
    assert result.pcf_full_kg_co2_per_unit == Decimal("3374.89")
    assert result.processes == []


def test_two_identical_routes_average_to_the_same_base_value() -> None:
    """Two routes with equal shares and no override average back to the base figure."""
    calculation_input = CalculationInput(
        processes=[
            ProcessInput(route_id="ammonia__smr", output_share_pct=Decimal("50")),
            ProcessInput(route_id="ammonia__coal_gasification", output_share_pct=Decimal("50")),
        ],
        **_AMMONIA_SMR_KWARGS,
    )
    result = calculate(calculation_input)
    assert result.cbam_embedded_kg_co2_per_unit == Decimal("3293.89")
    assert result.pcf_full_kg_co2_per_unit == Decimal("3374.89")
    assert len(result.processes) == 2
    assert {p.route_id for p in result.processes} == {
        "ammonia__smr",
        "ammonia__coal_gasification",
    }
    assert all(not p.used_override for p in result.processes)


def test_route_with_custom_coefficient_overrides_the_base_value() -> None:
    """A route with its own override blends in at its own figure, not the base one."""
    calculation_input = CalculationInput(
        processes=[
            ProcessInput(route_id="ammonia__smr", output_share_pct=Decimal("50")),
            ProcessInput(
                route_id="ammonia__coal_gasification",
                output_share_pct=Decimal("50"),
                ef_override_kg_co2_per_unit=Decimal("5000"),
            ),
        ],
        **_AMMONIA_SMR_KWARGS,
    )
    result = calculate(calculation_input)
    # (3293.888 * 0.5) + (5000 * 0.5) = 4146.944 -> 4146.94
    assert result.cbam_embedded_kg_co2_per_unit == Decimal("4146.94")
    overridden = next(p for p in result.processes if p.route_id == "ammonia__coal_gasification")
    assert overridden.used_override is True
    assert overridden.cbam_embedded_kg_co2_per_unit == Decimal("5000.00")


def test_zero_shares_fall_back_to_an_even_split() -> None:
    calculation_input = CalculationInput(
        processes=[
            ProcessInput(route_id="ammonia__smr", output_share_pct=Decimal("0.0001")),
            ProcessInput(route_id="ammonia__coal_gasification", output_share_pct=Decimal("0.0001")),
        ],
        **_AMMONIA_SMR_KWARGS,
    )
    result = calculate(calculation_input)
    assert result.cbam_embedded_kg_co2_per_unit == Decimal("3293.89")


def test_simple_good_zeroes_out_precursor_emissions(monkeypatch: pytest.MonkeyPatch) -> None:
    """A product flagged as a 'simple good' must not count precursor (upstream)
    emissions toward cbam_embedded, per EU CBAM Guidance No.3's 'Simple goods'
    definition — but the full PCF figure still includes them.
    """
    original_get_product = reference.get_product
    ammonia = original_get_product("ammonia")
    simple_ammonia = replace(ammonia, requires_precursor_accounting=False)
    monkeypatch.setattr(
        reference,
        "get_product",
        lambda product_id: simple_ammonia
        if product_id == "ammonia"
        else original_get_product(product_id),
    )

    calculation_input = CalculationInput(route_id="ammonia__smr", **_AMMONIA_SMR_KWARGS)
    result = calculate(calculation_input)

    # pcf_full is unaffected (always includes all raw_materials).
    assert result.pcf_full_kg_co2_per_unit == Decimal("3374.89")
    # cbam_embedded drops the 1320.0 upstream/precursor contribution.
    assert result.cbam_embedded_kg_co2_per_unit == Decimal("1973.89")
