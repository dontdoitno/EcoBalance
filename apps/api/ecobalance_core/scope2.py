"""Scope 2 — indirect emissions from purchased electricity, steam, and heat
(PROMPT_CLAUDE_CODE.md §5.1):

    E_indirect = Q_el × EF_el + Q_steam × EF_steam + Q_heat × EF_heat
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from ecobalance_core import reference
from ecobalance_core.models import CalculationInput


@dataclass(frozen=True)
class Scope2Result:
    total_kg_co2_per_unit: Decimal
    electricity_kg_co2_per_unit: Decimal
    heat_kg_co2_per_unit: Decimal


def _electricity_emission(calculation_input: CalculationInput) -> Decimal:
    electricity = calculation_input.electricity
    if electricity is None:
        return Decimal("0")

    ef = electricity.ef_override_kg_co2_per_mwh
    if ef is None:
        if electricity.region_id is None:
            return Decimal("0")
        ef = reference.get_region(electricity.region_id).ef_el_kg_co2_per_mwh

    return electricity.consumption_mwh_per_unit * ef


def _heat_emission(calculation_input: CalculationInput) -> Decimal:
    heat = calculation_input.heat
    if heat is None:
        return Decimal("0")

    if heat.ef_override_kg_co2_per_gj is not None:
        ef = heat.ef_override_kg_co2_per_gj
    elif heat.boiler_fuel_id is not None:
        fuel_ef = reference.get_fuel(heat.boiler_fuel_id).ef_kg_co2_per_gj
        efficiency = heat.boiler_efficiency_pct / Decimal(100)
        if efficiency <= 0:
            raise ValueError("boiler_efficiency_pct must be positive")
        ef = fuel_ef / efficiency
    else:
        raise ValueError("heat input requires either an EF override or a boiler_fuel_id")

    return heat.consumption_gj_per_unit * ef


def calculate(calculation_input: CalculationInput) -> Scope2Result:
    electricity_kg_co2 = _electricity_emission(calculation_input)
    heat_kg_co2 = _heat_emission(calculation_input)
    return Scope2Result(
        total_kg_co2_per_unit=electricity_kg_co2 + heat_kg_co2,
        electricity_kg_co2_per_unit=electricity_kg_co2,
        heat_kg_co2_per_unit=heat_kg_co2,
    )
