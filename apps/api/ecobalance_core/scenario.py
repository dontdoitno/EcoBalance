"""Scenarios: apply a set of measures to a calculation input and compare
the recalculated result against the baseline.

Effects of measures touching the same input fields compose by sequential
application to one mutated copy of the input (not by multiplying or
summing percentages) — see measures.py.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Any

from ecobalance_core import measures
from ecobalance_core.engine import calculate
from ecobalance_core.models import CalculationInput, CalculationResult


@dataclass(frozen=True)
class ScenarioResult:
    baseline: CalculationResult
    scenario: CalculationResult
    applied_measure_ids: list[str]
    delta_pcf_full_kg_co2_per_unit: Decimal
    delta_pcf_full_pct: Decimal
    delta_cbam_embedded_kg_co2_per_unit: Decimal | None


def run_scenario(
    base_input: CalculationInput,
    measure_ids: list[str],
    assumption_overrides: dict[str, dict[str, Any]] | None = None,
) -> ScenarioResult:
    assumption_overrides = assumption_overrides or {}

    baseline = calculate(base_input)

    mutated = base_input.model_copy(deep=True)
    for measure_id in measure_ids:
        assumptions = {
            **measures.default_assumptions(measure_id),
            **assumption_overrides.get(measure_id, {}),
        }
        mutated = measures.apply(measure_id, mutated, assumptions)

    scenario = calculate(mutated)

    delta_pcf = baseline.pcf_full_kg_co2_per_unit - scenario.pcf_full_kg_co2_per_unit
    delta_pct = (
        (delta_pcf / baseline.pcf_full_kg_co2_per_unit * Decimal(100))
        if baseline.pcf_full_kg_co2_per_unit != 0
        else Decimal("0")
    )
    delta_cbam = None
    if (
        baseline.cbam_embedded_kg_co2_per_unit is not None
        and scenario.cbam_embedded_kg_co2_per_unit is not None
    ):
        delta_cbam = baseline.cbam_embedded_kg_co2_per_unit - scenario.cbam_embedded_kg_co2_per_unit

    return ScenarioResult(
        baseline=baseline,
        scenario=scenario,
        applied_measure_ids=measure_ids,
        delta_pcf_full_kg_co2_per_unit=delta_pcf,
        delta_pcf_full_pct=delta_pct,
        delta_cbam_embedded_kg_co2_per_unit=delta_cbam,
    )
