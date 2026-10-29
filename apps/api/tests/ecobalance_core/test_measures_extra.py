from decimal import Decimal

from ecobalance_core import measures
from ecobalance_core.models import (
    CalculationInput,
    ProcessEmissionsInput,
)


def test_carbon_capture_applicable_and_reduces_footprint() -> None:
    calculation_input = CalculationInput(
        product_id="ammonia",
        process=ProcessEmissionsInput(
            co2_process_t_per_year=Decimal("100"),
            fugitive_ch4_t_per_year=Decimal("2"),
        ),
    )
    assert measures.is_applicable("carbon_capture", calculation_input)

    from ecobalance_core.scenario import run_scenario

    scenario = run_scenario(calculation_input, ["carbon_capture"])
    assert scenario.scenario.pcf_full_kg_co2_per_unit < scenario.baseline.pcf_full_kg_co2_per_unit


def test_raw_material_switch_adds_substitute_line() -> None:
    from ecobalance_core.models import RawMaterialInput

    calculation_input = CalculationInput(
        product_id="ammonia",
        raw_materials=[
            RawMaterialInput(material_id="coal_feedstock", quantity_t_per_unit=Decimal("1"))
        ],
    )
    mutated = measures.apply(
        "raw_material_switch",
        calculation_input,
        measures.default_assumptions("raw_material_switch"),
    )
    material_ids = {m.material_id for m in mutated.raw_materials}
    assert "coal_feedstock" in material_ids
    assert "biomass_feedstock" in material_ids


def test_catalog_has_metadata_for_every_measure() -> None:
    catalog = measures.load_catalog()
    for measure_id, meta in catalog.items():
        assert meta["title"]
        assert meta["scope"]
        assert meta["complexity_label"]
        assert measures.default_assumptions(measure_id) is not None
