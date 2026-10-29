"""Scope 1 — direct emissions (PROMPT_CLAUDE_CODE.md §5.1):

    E_direct = Σ_i (Q_i × NCV_i × EF_i) + E_process − E_captured + E_flare + E_fugitive + E_n2o

Fuel combustion/feedstock-with-combustion quantities are per functional
unit; process/flare/fugitive/captured/N2O figures are annual site totals,
normalized here by dividing by `actual_output_t`.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from ecobalance_core import reference, units
from ecobalance_core.gwp import GWP_CH4, GWP_N2O
from ecobalance_core.models import CalculationInput, FuelInput


@dataclass(frozen=True)
class Scope1Result:
    total_kg_co2_per_unit: Decimal
    fuel_combustion_kg_co2_per_unit: Decimal
    process_kg_co2_per_unit: Decimal


def _fuel_emission_kg_co2(fuel_input: FuelInput) -> Decimal:
    factor = reference.get_fuel(fuel_input.fuel_id)
    ncv = fuel_input.ncv_override_mj_per_unit or factor.ncv_mj_per_unit
    ef = fuel_input.ef_override_kg_co2_per_gj or factor.ef_kg_co2_per_gj

    if factor.unit == "thousand_m3":
        energy_gj = units.thousand_m3_to_gj(fuel_input.quantity, ncv)
    else:
        # ncv_mj_per_unit for solid/liquid fuels is MJ per tonne; convert via kg.
        ncv_per_kg = ncv / Decimal(1000)
        energy_gj = units.mass_to_gj(fuel_input.quantity, ncv_per_kg)

    return energy_gj * ef


def calculate(calculation_input: CalculationInput) -> Scope1Result:
    fuel_emissions = sum(
        (
            _fuel_emission_kg_co2(fuel)
            for fuel in calculation_input.fuels
            if fuel.use in ("fuel", "both")
        ),
        start=Decimal("0"),
    )

    process = calculation_input.process
    process_kg_co2 = Decimal("0")
    if process is not None:
        output_t = calculation_input.actual_output_t
        gwp_set = calculation_input.gwp_set

        process_co2 = units.tonnes_to_kg(process.co2_process_t_per_year) / output_t
        flare = units.tonnes_to_kg(process.flare_t_per_year) / output_t
        fugitive_ch4 = (
            units.tonnes_to_kg(process.fugitive_ch4_t_per_year) * GWP_CH4[gwp_set] / output_t
        )
        n2o = units.tonnes_to_kg(process.n2o_t_per_year) * GWP_N2O[gwp_set] / output_t
        captured = units.tonnes_to_kg(process.captured_co2_t_per_year) / output_t

        process_kg_co2 = process_co2 + flare + fugitive_ch4 + n2o - captured

    total = fuel_emissions + process_kg_co2
    return Scope1Result(
        total_kg_co2_per_unit=total,
        fuel_combustion_kg_co2_per_unit=fuel_emissions,
        process_kg_co2_per_unit=process_kg_co2,
    )
