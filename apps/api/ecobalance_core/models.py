"""Pydantic v2 input/output models for the calculation engine.

All quantities are expressed **per functional unit** (default: 1 tonne of
product) unless a field name says "_per_year" — annual process-level
figures (flaring, fugitive losses, captured CO2) are normalized to the
functional unit inside the engine by dividing by `actual_output_t`, since
that is how real process data is reported. This is documented in
docs/architecture/core-engine.md.

Internal math uses `Decimal` throughout (see ADR-0002); this boundary
module is where `Decimal` is the wire type too — FastAPI/Pydantic handles
`Decimal` JSON (de)serialization natively, and the API layer is the only
place that should ever round to `float` for display.
"""

from __future__ import annotations

from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field, model_validator

Boundary = Literal["cradle_to_gate", "cradle_to_border", "cradle_to_grave"]
GWPSet = Literal["AR5", "AR6"]
FunctionalUnit = Literal["t", "kg", "m3"]
AllocationMethod = Literal["mass", "energy", "economic", "system_expansion"]
FuelUse = Literal["fuel", "feedstock", "both"]
ElectricitySource = Literal["grid", "own_generation", "ppa", "mixed"]
EFType = Literal["location_based", "market_based"]
TransportDirection = Literal["inbound_material", "outbound_product", "internal_logistics"]
WasteKind = Literal["solid", "liquid", "gaseous"]


class FuelInput(BaseModel):
    fuel_id: str
    quantity: Decimal = Field(gt=0)
    use: FuelUse = "fuel"
    ncv_override_mj_per_unit: Decimal | None = None
    ef_override_kg_co2_per_gj: Decimal | None = None


class RawMaterialInput(BaseModel):
    material_id: str
    quantity_t_per_unit: Decimal = Field(gt=0)
    origin: str | None = None
    supplier: str | None = None
    ef_override_kg_co2_per_t: Decimal | None = None
    ef_source_override: str | None = None
    year: int | None = None
    carbon_content_pct: Decimal | None = None


class ElectricityInput(BaseModel):
    consumption_mwh_per_unit: Decimal = Field(ge=0)
    source: ElectricitySource = "grid"
    region_id: str | None = None
    ef_override_kg_co2_per_mwh: Decimal | None = None
    ef_type: EFType = "location_based"

    @model_validator(mode="after")
    def _require_region_or_override(self) -> ElectricityInput:
        if self.region_id is None and self.ef_override_kg_co2_per_mwh is None:
            raise ValueError("electricity requires either region_id or an EF override")
        return self


class HeatInput(BaseModel):
    consumption_gj_per_unit: Decimal = Field(ge=0)
    source: Literal["own_boiler", "chp", "purchased_steam"] = "own_boiler"
    boiler_fuel_id: str | None = None
    boiler_efficiency_pct: Decimal = Decimal("85")
    ef_override_kg_co2_per_gj: Decimal | None = None


class ProcessEmissionsInput(BaseModel):
    co2_process_t_per_year: Decimal = Decimal("0")
    flare_t_per_year: Decimal = Decimal("0")
    fugitive_ch4_t_per_year: Decimal = Decimal("0")
    n2o_t_per_year: Decimal = Decimal("0")
    captured_co2_t_per_year: Decimal = Decimal("0")
    captured_use: Literal["storage", "urea_production", "sale", "other"] | None = None


class TransportLegInput(BaseModel):
    direction: TransportDirection
    mode_id: str
    distance_km: Decimal = Field(ge=0)
    mass_t_per_unit: Decimal = Field(ge=0)
    ef_override_kg_co2_per_tkm: Decimal | None = None


class WasteStreamInput(BaseModel):
    kind: WasteKind
    quantity_t_per_unit: Decimal = Field(ge=0)
    treatment_id: str
    ef_override_kg_co2_per_t: Decimal | None = None
    wastewater_treated: bool = False
    wastewater_m3_per_unit: Decimal = Decimal("0")


class CoProductInput(BaseModel):
    name: str
    quantity_t_per_year: Decimal = Field(gt=0)
    economic_value_per_t: Decimal | None = None
    energy_content_gj_per_t: Decimal | None = None


class AllocationInput(BaseModel):
    method: AllocationMethod
    rationale: str = Field(min_length=1)
    substituted_quantity_t_per_year: Decimal | None = None
    substituted_ef_kg_co2_per_t: Decimal | None = None

    @model_validator(mode="after")
    def _system_expansion_requires_substitution(self) -> AllocationInput:
        if self.method == "system_expansion" and (
            self.substituted_quantity_t_per_year is None or self.substituted_ef_kg_co2_per_t is None
        ):
            raise ValueError(
                "system_expansion allocation requires substituted_quantity_t_per_year "
                "and substituted_ef_kg_co2_per_t"
            )
        return self


class DataQualityInput(BaseModel):
    primary_data_share_pct: Decimal = Decimal("100")
    uncertainty_pct: Decimal = Decimal("0")
    verified_third_party: bool = False
    verifier: str | None = None


class CalculationInput(BaseModel):
    product_id: str
    route_id: str | None = None
    annual_capacity_t: Decimal | None = None
    actual_output_t: Decimal = Field(gt=0, default=Decimal("1"))
    functional_unit: FunctionalUnit = "t"
    boundary: Boundary = "cradle_to_gate"
    gwp_set: GWPSet = "AR5"

    fuels: list[FuelInput] = Field(default_factory=list)
    raw_materials: list[RawMaterialInput] = Field(default_factory=list)
    electricity: ElectricityInput | None = None
    heat: HeatInput | None = None
    process: ProcessEmissionsInput | None = None
    transport: list[TransportLegInput] = Field(default_factory=list)
    waste: list[WasteStreamInput] = Field(default_factory=list)

    main_product_energy_content_gj_per_t: Decimal | None = None
    main_product_economic_value_per_t: Decimal | None = None
    co_products: list[CoProductInput] = Field(default_factory=list)
    allocation: AllocationInput | None = None

    data_quality: DataQualityInput | None = None

    @model_validator(mode="after")
    def _allocation_required_with_co_products(self) -> CalculationInput:
        if self.co_products and self.allocation is None:
            raise ValueError("co_products present but no allocation method/rationale was given")
        return self


class BreakdownItem(BaseModel):
    category: Literal["upstream", "energy", "transport", "waste", "process"]
    label: str
    scope: Literal["Scope 1", "Scope 2", "Scope 3"]
    value_kg_co2_per_unit: Decimal
    percentage: Decimal


class HotspotFlag(BaseModel):
    code: str
    message: str
    severity: Literal["info", "warning"]


class Hotspot(BaseModel):
    category: str
    label: str
    scope: str
    contribution_pct: Decimal
    rating: Literal["critical", "significant", "low"]
    flags: list[HotspotFlag] = Field(default_factory=list)


class CalculationResult(BaseModel):
    pcf_full_kg_co2_per_unit: Decimal
    cbam_embedded_kg_co2_per_unit: Decimal | None
    cbam_applicable: bool
    cbam_not_applicable_reason: str | None

    scope1_kg_co2_per_unit: Decimal
    scope2_kg_co2_per_unit: Decimal
    scope3_kg_co2_per_unit: Decimal

    breakdown: list[BreakdownItem]
    hotspots: list[Hotspot]
    allocation_factor: Decimal
    allocation_credit_kg_co2_per_unit: Decimal

    data_quality_score: Decimal | None
    data_quality_flags: list[HotspotFlag]

    gwp_set: GWPSet
    boundary: Boundary
    functional_unit: FunctionalUnit
