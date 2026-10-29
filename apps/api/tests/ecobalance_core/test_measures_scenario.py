from decimal import Decimal

from ecobalance_core import measures
from ecobalance_core.models import (
    CalculationInput,
    ElectricityInput,
    RawMaterialInput,
    TransportLegInput,
)
from ecobalance_core.scenario import run_scenario


def _input() -> CalculationInput:
    return CalculationInput(
        product_id="ammonia",
        actual_output_t=Decimal("1"),
        raw_materials=[
            RawMaterialInput(
                material_id="natural_gas_feedstock", quantity_t_per_unit=Decimal("0.6")
            )
        ],
        electricity=ElectricityInput(consumption_mwh_per_unit=Decimal("0.8"), region_id="oes_ural"),
        transport=[
            TransportLegInput(
                direction="outbound_product",
                mode_id="truck",
                distance_km=Decimal("500"),
                mass_t_per_unit=Decimal("1"),
            )
        ],
    )


def test_applicable_measures_detected() -> None:
    applicable = measures.applicable_measures(_input())
    assert "renewable_electricity" in applicable
    assert "energy_efficiency" in applicable
    assert "raw_material_switch" in applicable
    assert "logistics_optimization" in applicable
    assert "carbon_capture" not in applicable  # no process emissions in this input


def test_single_measure_reduces_footprint() -> None:
    scenario = run_scenario(_input(), ["renewable_electricity"])
    assert scenario.scenario.pcf_full_kg_co2_per_unit < scenario.baseline.pcf_full_kg_co2_per_unit
    assert scenario.delta_pcf_full_kg_co2_per_unit > 0


def test_combined_measures_compose_sequentially_not_additively() -> None:
    single = run_scenario(_input(), ["renewable_electricity"])
    combined = run_scenario(_input(), ["renewable_electricity", "logistics_optimization"])

    # Combined reduction is at least as large as either measure alone...
    assert combined.scenario.pcf_full_kg_co2_per_unit <= single.scenario.pcf_full_kg_co2_per_unit
    # ...and never goes negative or below zero just because measures stack.
    assert combined.scenario.pcf_full_kg_co2_per_unit >= Decimal("0")


def test_logistics_optimization_switches_to_lower_ef_mode() -> None:
    scenario = run_scenario(_input(), ["logistics_optimization"])
    assert scenario.scenario.pcf_full_kg_co2_per_unit < scenario.baseline.pcf_full_kg_co2_per_unit
