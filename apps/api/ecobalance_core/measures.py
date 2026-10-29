"""Optimization measure catalog: applicability + input mutation.

Metadata (title, scope, complexity, payback, standards, side effects,
default assumptions) lives in config/measures.yml. The applicability
predicate and the actual parameter mutation for each measure id live here,
in Python, because a mutation is executable logic, not data. A scenario's
effect on the footprint is always produced by mutating a copy of the
input and re-running `engine.calculate` on it — never by applying a
percentage directly to the result.
"""

from __future__ import annotations

from decimal import Decimal
from functools import lru_cache
from pathlib import Path
from typing import Any, Protocol

import yaml

from ecobalance_core.models import CalculationInput, RawMaterialInput

_CONFIG_PATH = Path(__file__).resolve().parents[1] / "config" / "measures.yml"

_SWITCHABLE_MATERIAL_IDS = {"natural_gas_feedstock", "naphtha_feedstock", "coal_feedstock"}


class Applicable(Protocol):
    def __call__(self, calculation_input: CalculationInput) -> bool: ...


class Apply(Protocol):
    def __call__(
        self, calculation_input: CalculationInput, assumptions: dict[str, Any]
    ) -> CalculationInput: ...


@lru_cache(maxsize=1)
def load_catalog() -> dict[str, dict[str, Any]]:
    with _CONFIG_PATH.open("r", encoding="utf-8") as config_file:
        config: dict[str, Any] = yaml.safe_load(config_file)
    measures: dict[str, dict[str, Any]] = config["measures"]
    return measures


def default_assumptions(measure_id: str) -> dict[str, Any]:
    raw = load_catalog()[measure_id].get("default_assumptions", {})
    return {
        key: (Decimal(str(value)) if isinstance(value, (int, float)) else value)
        for key, value in raw.items()
    }


def _is_renewable_electricity_applicable(calculation_input: CalculationInput) -> bool:
    electricity = calculation_input.electricity
    return electricity is not None and electricity.consumption_mwh_per_unit > Decimal("0.3")


def _apply_renewable_electricity(
    calculation_input: CalculationInput, assumptions: dict[str, Any]
) -> CalculationInput:
    mutated = calculation_input.model_copy(deep=True)
    if mutated.electricity is None:
        return mutated
    mutated.electricity.ef_override_kg_co2_per_mwh = assumptions["target_ef_kg_co2_per_mwh"]
    mutated.electricity.ef_type = "market_based"
    return mutated


def _is_energy_efficiency_applicable(calculation_input: CalculationInput) -> bool:
    electricity = calculation_input.electricity
    return electricity is not None and electricity.consumption_mwh_per_unit > Decimal("0.5")


def _apply_energy_efficiency(
    calculation_input: CalculationInput, assumptions: dict[str, Any]
) -> CalculationInput:
    mutated = calculation_input.model_copy(deep=True)
    if mutated.electricity is None:
        return mutated
    ratio = assumptions["reduction_ratio"]
    mutated.electricity.consumption_mwh_per_unit *= Decimal(1) - ratio
    return mutated


def _is_raw_material_switch_applicable(calculation_input: CalculationInput) -> bool:
    return any(m.material_id in _SWITCHABLE_MATERIAL_IDS for m in calculation_input.raw_materials)


def _apply_raw_material_switch(
    calculation_input: CalculationInput, assumptions: dict[str, Any]
) -> CalculationInput:
    mutated = calculation_input.model_copy(deep=True)
    switch_ratio: Decimal = assumptions["switch_ratio"]
    target_material_id: str = assumptions["target_material_id"]

    new_materials: list[RawMaterialInput] = []
    for material in mutated.raw_materials:
        if material.material_id in _SWITCHABLE_MATERIAL_IDS:
            switched_qty = material.quantity_t_per_unit * switch_ratio
            material.quantity_t_per_unit *= Decimal(1) - switch_ratio
            new_materials.append(
                RawMaterialInput(
                    material_id=target_material_id,
                    quantity_t_per_unit=switched_qty,
                    origin="switched",
                )
            )
    mutated.raw_materials = [*mutated.raw_materials, *new_materials]
    return mutated


def _is_logistics_applicable(calculation_input: CalculationInput) -> bool:
    return len(calculation_input.transport) > 0


def _apply_logistics_optimization(
    calculation_input: CalculationInput, assumptions: dict[str, Any]
) -> CalculationInput:
    from ecobalance_core import reference

    mutated = calculation_input.model_copy(deep=True)
    target_mode_id: str = assumptions["target_mode_id"]
    target_ef = reference.get_transport_mode(target_mode_id).ef_kg_co2_per_tkm

    for leg in mutated.transport:
        current_ef = (
            leg.ef_override_kg_co2_per_tkm
            or reference.get_transport_mode(leg.mode_id).ef_kg_co2_per_tkm
        )
        if target_ef < current_ef:
            leg.mode_id = target_mode_id
            leg.ef_override_kg_co2_per_tkm = None
    return mutated


def _is_carbon_capture_applicable(calculation_input: CalculationInput) -> bool:
    process = calculation_input.process
    if process is None:
        return False
    return (
        process.co2_process_t_per_year + process.flare_t_per_year + process.fugitive_ch4_t_per_year
    ) > Decimal("0")


def _apply_carbon_capture(
    calculation_input: CalculationInput, assumptions: dict[str, Any]
) -> CalculationInput:
    mutated = calculation_input.model_copy(deep=True)
    if mutated.process is None:
        return mutated
    ratio: Decimal = assumptions["capture_ratio"]
    mutated.process.captured_co2_t_per_year += ratio * mutated.process.co2_process_t_per_year
    mutated.process.fugitive_ch4_t_per_year *= Decimal(1) - ratio
    return mutated


_APPLICABILITY: dict[str, Applicable] = {
    "renewable_electricity": _is_renewable_electricity_applicable,
    "energy_efficiency": _is_energy_efficiency_applicable,
    "raw_material_switch": _is_raw_material_switch_applicable,
    "logistics_optimization": _is_logistics_applicable,
    "carbon_capture": _is_carbon_capture_applicable,
}

_MUTATIONS: dict[str, Apply] = {
    "renewable_electricity": _apply_renewable_electricity,
    "energy_efficiency": _apply_energy_efficiency,
    "raw_material_switch": _apply_raw_material_switch,
    "logistics_optimization": _apply_logistics_optimization,
    "carbon_capture": _apply_carbon_capture,
}


def is_applicable(measure_id: str, calculation_input: CalculationInput) -> bool:
    return _APPLICABILITY[measure_id](calculation_input)


def apply(
    measure_id: str, calculation_input: CalculationInput, assumptions: dict[str, Any]
) -> CalculationInput:
    return _MUTATIONS[measure_id](calculation_input, assumptions)


def applicable_measures(calculation_input: CalculationInput) -> list[str]:
    return [
        measure_id for measure_id in load_catalog() if is_applicable(measure_id, calculation_input)
    ]
