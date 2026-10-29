"""Demo reference data: fuels, raw materials, regions, transport, waste,
products/routes, and CBAM applicability.

Every factor below is **illustrative**, not verified against a real
standard or database (DEFRA/Ecoinvent/Росстат/etc.). Each carries
`source="demo"`, a `year`, and `is_demo=True` so callers and the UI can
flag it. Replacing these with verified figures is explicitly out of scope
for this pass — see docs/methodology/emission-factors.md.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Literal

FuelUnit = Literal["t", "thousand_m3"]


@dataclass(frozen=True)
class FuelFactor:
    id: str
    name: str
    unit: FuelUnit
    ncv_mj_per_unit: Decimal  # MJ per tonne (unit="t") or per thousand m3 (unit="thousand_m3")
    ef_kg_co2_per_gj: Decimal
    source: str
    year: int
    is_demo: bool = True


@dataclass(frozen=True)
class RawMaterialFactor:
    id: str
    name: str
    ef_kg_co2_per_t: Decimal
    source: str
    year: int
    is_demo: bool = True


@dataclass(frozen=True)
class RegionFactor:
    id: str
    name: str
    ef_el_kg_co2_per_mwh: Decimal
    source: str
    year: int
    is_demo: bool = True


@dataclass(frozen=True)
class TransportFactor:
    id: str
    name: str
    ef_kg_co2_per_tkm: Decimal
    source: str
    year: int
    is_demo: bool = True


@dataclass(frozen=True)
class WasteTreatmentFactor:
    id: str
    name: str
    ef_kg_co2_per_t: Decimal
    source: str
    year: int
    is_demo: bool = True


@dataclass(frozen=True)
class Product:
    id: str
    name: str
    cas: str | None
    cbam_applicable: bool
    cn_code: str | None
    default_routes: tuple[str, ...]


@dataclass(frozen=True)
class Route:
    id: str
    product_id: str
    name: str


# --- Fuels -------------------------------------------------------------
# NCV: natural gas/thousand m3 figures as MJ per thousand m3 (so "per unit"
# below means per thousand m3 for gas, per tonne for solids/liquids).
FUELS: tuple[FuelFactor, ...] = (
    FuelFactor(
        "natural_gas",
        "Природный газ",
        "thousand_m3",
        Decimal("34000"),
        Decimal("56.1"),
        "demo",
        2024,
    ),
    FuelFactor("naphtha", "Нафта", "t", Decimal("44000"), Decimal("73.3"), "demo", 2024),
    FuelFactor("coal", "Уголь", "t", Decimal("24000"), Decimal("95.8"), "demo", 2024),
    FuelFactor("mazut", "Мазут", "t", Decimal("40400"), Decimal("77.4"), "demo", 2024),
    FuelFactor("diesel", "Дизельное топливо", "t", Decimal("43000"), Decimal("74.1"), "demo", 2024),
    FuelFactor("propane", "Пропан", "t", Decimal("46000"), Decimal("63.1"), "demo", 2024),
    FuelFactor("hydrogen", "Водород", "t", Decimal("120000"), Decimal("0"), "demo", 2024),
    FuelFactor("biomass", "Биомасса", "t", Decimal("15000"), Decimal("0"), "demo", 2024),
)

# --- Raw materials (upstream, Scope 3) ---------------------------------
RAW_MATERIALS: tuple[RawMaterialFactor, ...] = (
    RawMaterialFactor(
        "natural_gas_feedstock", "Природный газ (сырьё)", Decimal("2200"), "demo", 2024
    ),
    RawMaterialFactor("naphtha_feedstock", "Нафта (сырьё)", Decimal("2700"), "demo", 2024),
    RawMaterialFactor("coal_feedstock", "Уголь (сырьё)", Decimal("3400"), "demo", 2024),
    RawMaterialFactor("biomass_feedstock", "Биомасса (сырьё)", Decimal("150"), "demo", 2024),
    RawMaterialFactor("ammonia_feedstock", "Аммиак (сырьё)", Decimal("2400"), "demo", 2024),
    RawMaterialFactor("co2_feedstock", "CO₂ (сырьё)", Decimal("0"), "demo", 2024),
    RawMaterialFactor("ethylene_feedstock", "Этилен (сырьё)", Decimal("1500"), "demo", 2024),
    RawMaterialFactor("propylene_feedstock", "Пропилен (сырьё)", Decimal("1600"), "demo", 2024),
    RawMaterialFactor("chlorine_feedstock", "Хлор (сырьё)", Decimal("1100"), "demo", 2024),
    RawMaterialFactor(
        "sulfuric_acid_feedstock", "Серная кислота (сырьё)", Decimal("180"), "demo", 2024
    ),
    RawMaterialFactor("benzene_feedstock", "Бензол (сырьё)", Decimal("1200"), "demo", 2024),
    RawMaterialFactor(
        "isopropanol_feedstock", "Изопропанол (сырьё)", Decimal("1400"), "demo", 2024
    ),
)

# --- Electricity regions (ОЭС) -----------------------------------------
REGIONS: tuple[RegionFactor, ...] = (
    RegionFactor("oes_center", "ОЭС Центра", Decimal("350"), "demo", 2024),
    RegionFactor("oes_northwest", "ОЭС Северо-Запада", Decimal("320"), "demo", 2024),
    RegionFactor("oes_south", "ОЭС Юга", Decimal("450"), "demo", 2024),
    RegionFactor("oes_middle_volga", "ОЭС Средней Волги", Decimal("380"), "demo", 2024),
    RegionFactor("oes_ural", "ОЭС Урала", Decimal("580"), "demo", 2024),
    RegionFactor("oes_siberia", "ОЭС Сибири", Decimal("420"), "demo", 2024),
    RegionFactor("oes_east", "ОЭС Востока", Decimal("460"), "demo", 2024),
    RegionFactor("isolated", "Изолированные энергосистемы", Decimal("650"), "demo", 2024),
)

# --- Transport -----------------------------------------------------------
TRANSPORT_MODES: tuple[TransportFactor, ...] = (
    TransportFactor("truck", "Автомобильный транспорт", Decimal("0.162"), "demo", 2024),
    TransportFactor("rail", "Железнодорожный транспорт", Decimal("0.022"), "demo", 2024),
    TransportFactor("ship", "Морской транспорт", Decimal("0.015"), "demo", 2024),
    TransportFactor("river", "Речной транспорт", Decimal("0.031"), "demo", 2024),
    TransportFactor("air", "Воздушный транспорт", Decimal("0.602"), "demo", 2024),
    TransportFactor("pipeline", "Трубопроводный транспорт", Decimal("0.005"), "demo", 2024),
)

# --- Waste treatment -----------------------------------------------------
WASTE_TREATMENTS: tuple[WasteTreatmentFactor, ...] = (
    WasteTreatmentFactor("landfill", "Захоронение", Decimal("450"), "demo", 2024),
    WasteTreatmentFactor("incineration", "Сжигание", Decimal("900"), "demo", 2024),
    WasteTreatmentFactor("recycling", "Переработка", Decimal("90"), "demo", 2024),
    WasteTreatmentFactor("composting", "Компостирование", Decimal("40"), "demo", 2024),
    WasteTreatmentFactor("water_discharge", "Сброс в воду", Decimal("20"), "demo", 2024),
)
WASTEWATER_TREATMENT_EF_KG_CO2_PER_M3 = Decimal("0.3")

# --- Products & routes -----------------------------------------------------
# CBAM applicability per PROMPT_CLAUDE_CODE.md §5.2: only fertilizer-category
# products among the demo catalog are CBAM-applicable; others fall under
# "CBAM not applicable" and get a PCF (ISO 14067) report instead.
PRODUCTS: tuple[Product, ...] = (
    Product(
        "ammonia",
        "Аммиак",
        "7664-41-7",
        True,
        "2814 10 000",
        ("smr", "coal_gasification", "oil_residue_gasification", "water_electrolysis"),
    ),
    Product("urea", "Мочевина", "57-13-6", True, "3102 10", ("ammonia_co2_synthesis", "other")),
    Product(
        "ammonium_sulfate",
        "Сульфат аммония",
        "7783-20-2",
        True,
        "3102 21 000",
        ("neutralization", "caprolactam_byproduct"),
    ),
    Product(
        "ethanol",
        "Этанол",
        "64-17-5",
        False,
        None,
        (
            "ethylene_hydration",
            "sugar_fermentation",
            "cellulose_fermentation",
            "biomass_gasification",
        ),
    ),
    Product(
        "polyethylene",
        "Полиэтилен",
        "9002-88-4",
        False,
        None,
        ("gas_phase", "suspension", "solution", "high_pressure"),
    ),
    Product("pvc", "ПВХ", "9002-86-2", False, None, ("suspension", "emulsion", "bulk")),
    Product(
        "acetone",
        "Ацетон",
        "67-64-1",
        False,
        None,
        ("cumene", "isopropanol_dehydrogenation", "propylene_oxidation"),
    ),
)

_ROUTE_NAMES_RU: dict[str, str] = {
    "smr": "Паровой риформинг природного газа (SMR)",
    "coal_gasification": "Газификация угля",
    "oil_residue_gasification": "Газификация нефтяных остатков",
    "water_electrolysis": "Электролиз воды",
    "ammonia_co2_synthesis": "Синтез из аммиака и CO₂",
    "other": "Другой маршрут",
    "neutralization": "Нейтрализация аммиака серной кислотой",
    "caprolactam_byproduct": "Побочный продукт капролактама",
    "ethylene_hydration": "Гидратация этилена",
    "sugar_fermentation": "Ферментация сахаров",
    "cellulose_fermentation": "Ферментация целлюлозы",
    "biomass_gasification": "Газификация биомассы",
    "gas_phase": "Газофазный",
    "suspension": "Суспензионный",
    "solution": "Растворный",
    "high_pressure": "Высокого давления",
    "emulsion": "Эмульсионный",
    "bulk": "Блочный (массовый)",
    "cumene": "Кумольный",
    "isopropanol_dehydrogenation": "Дегидрирование изопропанола",
    "propylene_oxidation": "Окисление пропилена",
}

ROUTES: tuple[Route, ...] = tuple(
    Route(f"{product.id}__{route_id}", product.id, _ROUTE_NAMES_RU.get(route_id, route_id))
    for product in PRODUCTS
    for route_id in product.default_routes
)


def get_fuel(fuel_id: str) -> FuelFactor:
    for fuel in FUELS:
        if fuel.id == fuel_id:
            return fuel
    raise KeyError(f"Unknown fuel id: {fuel_id!r}")


def get_raw_material(material_id: str) -> RawMaterialFactor:
    for material in RAW_MATERIALS:
        if material.id == material_id:
            return material
    raise KeyError(f"Unknown raw material id: {material_id!r}")


def get_region(region_id: str) -> RegionFactor:
    for region in REGIONS:
        if region.id == region_id:
            return region
    raise KeyError(f"Unknown region id: {region_id!r}")


def get_transport_mode(mode_id: str) -> TransportFactor:
    for mode in TRANSPORT_MODES:
        if mode.id == mode_id:
            return mode
    raise KeyError(f"Unknown transport mode id: {mode_id!r}")


def get_waste_treatment(treatment_id: str) -> WasteTreatmentFactor:
    for treatment in WASTE_TREATMENTS:
        if treatment.id == treatment_id:
            return treatment
    raise KeyError(f"Unknown waste treatment id: {treatment_id!r}")


def get_product(product_id: str) -> Product:
    for product in PRODUCTS:
        if product.id == product_id:
            return product
    raise KeyError(f"Unknown product id: {product_id!r}")
