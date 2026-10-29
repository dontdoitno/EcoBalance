"""Golden cases, hand-verified. The same numbers are quoted in
docs/methodology/formulas.md so the two stay in sync — if a formula
changes, both this test and that doc must be updated together.
"""

from decimal import Decimal

from ecobalance_core.engine import calculate
from ecobalance_core.models import (
    CalculationInput,
    ElectricityInput,
    FuelInput,
    ProcessEmissionsInput,
    RawMaterialInput,
    TransportLegInput,
)


def test_ammonia_smr() -> None:
    """Ammonia via steam methane reforming (SMR): fuel + feedstock natural
    gas, grid electricity, one outbound truck leg. CBAM-applicable.

    Hand-computed:
      fuel combustion = 1 thousand m3 * 34 GJ/thousand m3 * 56.1 kg CO2/GJ = 1907.4
      upstream        = 0.6 t/t * 2200 kg CO2/t                            = 1320.0
      electricity     = 0.2 MWh/t * 350 kg CO2/MWh                          =   70.0
      transport       = 1 t * 500 km * 0.162 kg CO2/t.km                    =   81.0
      pcf_full = 1907.4 + 70.0 + 1320.0 + 81.0 = 3378.4
      cbam_embedded = 1907.4 + 70.0 + 1320.0 = 3297.4 (excludes transport)
    """
    calculation_input = CalculationInput(
        product_id="ammonia",
        route_id="ammonia__smr",
        actual_output_t=Decimal("1"),
        fuels=[FuelInput(fuel_id="natural_gas", quantity=Decimal("1"), use="fuel")],
        raw_materials=[
            RawMaterialInput(
                material_id="natural_gas_feedstock", quantity_t_per_unit=Decimal("0.6")
            )
        ],
        electricity=ElectricityInput(
            consumption_mwh_per_unit=Decimal("0.2"), region_id="oes_center"
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

    result = calculate(calculation_input)

    assert result.pcf_full_kg_co2_per_unit == Decimal("3378.40")
    assert result.cbam_applicable is True
    assert result.cbam_embedded_kg_co2_per_unit == Decimal("3297.40")
    assert result.scope1_kg_co2_per_unit == Decimal("1907.40")
    assert result.scope2_kg_co2_per_unit == Decimal("70.00")
    assert result.scope3_kg_co2_per_unit == Decimal("1401.00")

    total_pct = sum((item.percentage for item in result.breakdown), start=Decimal("0"))
    assert abs(total_pct - Decimal("100")) < Decimal("1")

    critical = {h.category for h in result.hotspots if h.rating == "critical"}
    assert "process" in critical  # Scope 1 (fuel combustion) is ~56% here
    assert "upstream" in critical  # ~39%


def test_pvc_suspension_not_cbam_applicable() -> None:
    """Suspension PVC: ethylene + chlorine feedstock, Ural grid electricity,
    no fuels/process/transport. Not CBAM-applicable.

    Hand-computed:
      upstream    = 0.45*1500 + 0.58*1100 = 675 + 638 = 1313.0
      electricity = 0.35 MWh/t * 580 kg CO2/MWh        = 203.0
      pcf_full = 1313.0 + 203.0 = 1516.0
    """
    calculation_input = CalculationInput(
        product_id="pvc",
        route_id="pvc__suspension",
        actual_output_t=Decimal("1"),
        raw_materials=[
            RawMaterialInput(material_id="ethylene_feedstock", quantity_t_per_unit=Decimal("0.45")),
            RawMaterialInput(material_id="chlorine_feedstock", quantity_t_per_unit=Decimal("0.58")),
        ],
        electricity=ElectricityInput(
            consumption_mwh_per_unit=Decimal("0.35"), region_id="oes_ural"
        ),
    )

    result = calculate(calculation_input)

    assert result.pcf_full_kg_co2_per_unit == Decimal("1516.00")
    assert result.cbam_applicable is False
    assert result.cbam_embedded_kg_co2_per_unit is None
    assert result.cbam_not_applicable_reason is not None
    assert "ПВХ" in result.cbam_not_applicable_reason


def test_urea_with_captured_co2() -> None:
    """Urea from ammonia + CO2 synthesis, with a captured-CO2 credit against
    process emissions (CBAM-applicable).

    Hand-computed (output = 100 t/year, process figures are annual totals):
      process = (200t - 150t) * 1000 / 100 = 500.0 kg CO2/t
      upstream = 0.57*2400 + 0.75*0 = 1368.0
      electricity = 0.05 MWh/t * 350 = 17.5
      pcf_full = 500.0 + 17.5 + 1368.0 = 1885.5
    """
    calculation_input = CalculationInput(
        product_id="urea",
        route_id="urea__ammonia_co2_synthesis",
        actual_output_t=Decimal("100"),
        raw_materials=[
            RawMaterialInput(material_id="ammonia_feedstock", quantity_t_per_unit=Decimal("0.57")),
            RawMaterialInput(material_id="co2_feedstock", quantity_t_per_unit=Decimal("0.75")),
        ],
        electricity=ElectricityInput(
            consumption_mwh_per_unit=Decimal("0.05"), region_id="oes_center"
        ),
        process=ProcessEmissionsInput(
            co2_process_t_per_year=Decimal("200"),
            captured_co2_t_per_year=Decimal("150"),
            captured_use="urea_production",
        ),
    )

    result = calculate(calculation_input)

    assert result.pcf_full_kg_co2_per_unit == Decimal("1885.50")
    assert result.cbam_applicable is True
    assert result.cbam_embedded_kg_co2_per_unit == Decimal("1885.50")

    # Capturing more CO2 must not increase the footprint (never make CCS look harmful).
    without_capture = calculation_input.model_copy(deep=True)
    without_capture.process.captured_co2_t_per_year = Decimal("0")  # type: ignore[union-attr]
    result_without_capture = calculate(without_capture)
    assert result_without_capture.pcf_full_kg_co2_per_unit > result.pcf_full_kg_co2_per_unit
