"""Scope 3 — upstream materials, transport, and waste
(PROMPT_CLAUDE_CODE.md §5.1):

    E_upstream  = Σ_j (M_j × EF_j)
    E_transport = Σ_k (M_k × D_k × EF_mode,k)
    E_waste     = Σ_l (M_l × EF_treatment,l)
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from ecobalance_core import reference
from ecobalance_core.models import (
    CalculationInput,
    RawMaterialInput,
    TransportLegInput,
    WasteStreamInput,
)


@dataclass(frozen=True)
class Scope3Result:
    total_kg_co2_per_unit: Decimal
    upstream_kg_co2_per_unit: Decimal
    transport_kg_co2_per_unit: Decimal
    waste_kg_co2_per_unit: Decimal


def _raw_material_emission(material: RawMaterialInput) -> Decimal:
    ef = material.ef_override_kg_co2_per_t
    if ef is None:
        ef = reference.get_raw_material(material.material_id).ef_kg_co2_per_t
    return material.quantity_t_per_unit * ef


def _transport_emission(leg: TransportLegInput) -> Decimal:
    ef = leg.ef_override_kg_co2_per_tkm
    if ef is None:
        ef = reference.get_transport_mode(leg.mode_id).ef_kg_co2_per_tkm
    return leg.mass_t_per_unit * leg.distance_km * ef


def _waste_emission(stream: WasteStreamInput) -> Decimal:
    ef = stream.ef_override_kg_co2_per_t
    if ef is None:
        ef = reference.get_waste_treatment(stream.treatment_id).ef_kg_co2_per_t
    total = stream.quantity_t_per_unit * ef
    if stream.wastewater_treated:
        total += stream.wastewater_m3_per_unit * reference.WASTEWATER_TREATMENT_EF_KG_CO2_PER_M3
    return total


def calculate(calculation_input: CalculationInput) -> Scope3Result:
    upstream = sum(
        (_raw_material_emission(material) for material in calculation_input.raw_materials),
        start=Decimal("0"),
    )
    transport = sum(
        (_transport_emission(leg) for leg in calculation_input.transport),
        start=Decimal("0"),
    )
    waste = sum(
        (_waste_emission(stream) for stream in calculation_input.waste),
        start=Decimal("0"),
    )
    return Scope3Result(
        total_kg_co2_per_unit=upstream + transport + waste,
        upstream_kg_co2_per_unit=upstream,
        transport_kg_co2_per_unit=transport,
        waste_kg_co2_per_unit=waste,
    )
