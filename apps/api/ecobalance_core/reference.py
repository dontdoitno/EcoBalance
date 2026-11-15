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
    # Per the 'Simple goods'/'Complex goods' definitions in EU CBAM Guidance
    # No.3: a simple good is produced exclusively from precursors and fuels
    # with zero embedded emissions, so precursor emissions are not counted.
    # Complex goods (e.g. cement, fertilisers) must include precursor
    # embedded emissions. All current CBAM products in this demo catalog
    # are fertiliser-category complex goods.
    requires_precursor_accounting: bool = True


@dataclass(frozen=True)
class Route:
    id: str
    product_id: str
    name: str


# --- Fuels -------------------------------------------------------------
# NCV: natural gas/thousand m3 figures as MJ per thousand m3 (so "per unit"
# below means per thousand m3 for gas, per tonne for solids/liquids).
#
# EF/NCV values are sourced from EU CBAM Guidance Document 3, Annex D,
# Table 4-7 (Standard values for fuel emission factors, IPCC 2006
# Guidelines) — t CO2/TJ is numerically equal to kg CO2/GJ, and
# NCV TJ/Gg is numerically equal to GJ/t (= 1000 MJ/t). `biomass` is kept
# at EF=0 under the GHG Protocol biogenic-CO2 convention: IPCC's "preliminary
# EF" for biomass (Table 4-8) is the pre-biogenic-correction figure and is
# intentionally not copied here. Entries carrying this source are
# `is_demo=False`; everything else in this file remains illustrative.
_IPCC_SOURCE = "EU CBAM Guidance No.3 Annex D (IPCC 2006 GL)"
FUELS: tuple[FuelFactor, ...] = (
    FuelFactor(
        "natural_gas",
        "Природный газ",
        "thousand_m3",
        Decimal("34000"),
        Decimal("56.1"),
        _IPCC_SOURCE,
        2006,
        is_demo=False,
    ),
    FuelFactor(
        "naphtha",
        "Нафта",
        "t",
        Decimal("44500"),
        Decimal("73.3"),
        _IPCC_SOURCE,
        2006,
        is_demo=False,
    ),
    FuelFactor(
        "coal",
        "Уголь (битуминозный)",
        "t",
        Decimal("25800"),
        Decimal("94.6"),
        _IPCC_SOURCE,
        2006,
        is_demo=False,
    ),
    FuelFactor(
        "mazut",
        "Мазут (топочный)",
        "t",
        Decimal("40400"),
        Decimal("77.4"),
        _IPCC_SOURCE,
        2006,
        is_demo=False,
    ),
    FuelFactor(
        "diesel",
        "Дизельное топливо (газойль)",
        "t",
        Decimal("43000"),
        Decimal("74.1"),
        _IPCC_SOURCE,
        2006,
        is_demo=False,
    ),
    FuelFactor(
        "propane",
        "Пропан (СУГ)",
        "t",
        Decimal("47300"),
        Decimal("63.1"),
        _IPCC_SOURCE,
        2006,
        is_demo=False,
    ),
    FuelFactor("hydrogen", "Водород", "t", Decimal("120000"), Decimal("0"), "demo", 2024),
    FuelFactor(
        "biomass",
        "Биомасса (сжигание)",
        "t",
        Decimal("15600"),
        Decimal("0"),
        _IPCC_SOURCE,
        2006,
        is_demo=False,
    ),
    # Additional solid/process fuels relevant to CBAM precursor chains
    # (cement, iron/steel, fertilisers) per the same Annex D table.
    FuelFactor(
        "anthracite",
        "Антрацит",
        "t",
        Decimal("26700"),
        Decimal("98.3"),
        _IPCC_SOURCE,
        2006,
        is_demo=False,
    ),
    FuelFactor(
        "lignite",
        "Лигнит (бурый уголь)",
        "t",
        Decimal("11900"),
        Decimal("101.0"),
        _IPCC_SOURCE,
        2006,
        is_demo=False,
    ),
    FuelFactor(
        "peat",
        "Торф",
        "t",
        Decimal("9760"),
        Decimal("106.0"),
        _IPCC_SOURCE,
        2006,
        is_demo=False,
    ),
    FuelFactor(
        "petroleum_coke",
        "Нефтяной кокс",
        "t",
        Decimal("32500"),
        Decimal("97.5"),
        _IPCC_SOURCE,
        2006,
        is_demo=False,
    ),
    # Blast furnace gas / coke oven gas: IPCC Annex D gives NCV on a mass
    # basis (TJ/Gg = MJ/t); no reliable gas-density figure is used here to
    # convert to a volumetric unit, so these stay mass-based ("t") like the
    # solid fuels above, unlike `natural_gas`'s "thousand_m3" convention.
    FuelFactor(
        "blast_furnace_gas",
        "Доменный газ",
        "t",
        Decimal("2470"),
        Decimal("260"),
        _IPCC_SOURCE,
        2006,
        is_demo=False,
    ),
    FuelFactor(
        "coke_oven_gas",
        "Коксовый газ",
        "t",
        Decimal("38700"),
        Decimal("44.4"),
        _IPCC_SOURCE,
        2006,
        is_demo=False,
    ),
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

# --- Electricity regions ------------------------------------------------
# Restructured from the old generic "ОЭС" (unified power system) grouping
# to atsenergo.ru's actual price/non-price zone structure
# (atsenergo.ru/results/co2all — "Коэффициент выбросов парниковых газов
# энергосистемы России"). The four zones below carry real figures: daily
# average of the hourly CO2e factor (к CO2e/MWh, includes CO2+CH4+N2O)
# from the site's "Плановые значения" hourly export for 2026-11-15
# (file: CARBON_plan_hour_15.11.2026_15.11.2026.csv). This is a single
# day's planned average, not a verified annual figure — treat as a
# realistic order-of-magnitude placeholder pending a proper
# monthly/annual "Фактические значения" pull. The remaining non-price
# zones the site publishes (НЦЗ Архангельской области, НЦЗ Республики
# Коми, изолированные ТИТЭС Камчатского края/Сахалинской области/
# Магаданской области/Чукотского АО) were not in that export and stay a
# single demo placeholder below pending a dedicated pull.
_ATSENERGO_SOURCE = "АТС (atsenergo.ru/results/co2all), план на 15.11.2026"
REGIONS: tuple[RegionFactor, ...] = (
    RegionFactor(
        "pricing_zone_europe_ural",
        "Первая ЦЗ (Европа и Урал)",
        Decimal("332.44"),
        _ATSENERGO_SOURCE,
        2026,
        is_demo=False,
    ),
    RegionFactor(
        "pricing_zone_siberia",
        "Вторая ЦЗ (Сибирь)",
        Decimal("452.09"),
        _ATSENERGO_SOURCE,
        2026,
        is_demo=False,
    ),
    RegionFactor(
        "pricing_zone_vostok",
        "Вторая ЦЗ (Восток)",
        Decimal("517.93"),
        _ATSENERGO_SOURCE,
        2026,
        is_demo=False,
    ),
    RegionFactor(
        "ncz_kaliningrad",
        "НЦЗ Калининградской области",
        Decimal("561.26"),
        _ATSENERGO_SOURCE,
        2026,
        is_demo=False,
    ),
    RegionFactor(
        "isolated",
        "Прочие неценовые/изолированные зоны (Архангельская обл., Коми, Камчатка, "
        "Сахалин, Магадан, Чукотка) — требует проверки по atsenergo.ru",
        Decimal("650"),
        "demo",
        2024,
    ),
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


# --- EU ETS free allocation phase-out for CBAM sectors ------------------
# Official schedule from CBAM Regulation (EU) 2023/956, Article 31a
# (amending EU ETS Directive 2003/87/EC Annex): the share of free EU ETS
# allowances that CBAM-sector installations still receive, phasing out to
# 0% by 2034. This is a report field only ("Free Allocation" in the
# cbamtrack.com-style template) — it does not feed into any emissions
# calculation here.
FREE_ALLOCATION_PCT: dict[int, Decimal] = {
    2026: Decimal("97.5"),
    2027: Decimal("95"),
    2028: Decimal("90"),
    2029: Decimal("77.5"),
    2030: Decimal("51.5"),
    2031: Decimal("39"),
    2032: Decimal("26.5"),
    2033: Decimal("14"),
    2034: Decimal("0"),
}


def get_free_allocation_pct(year: int) -> Decimal:
    if year < min(FREE_ALLOCATION_PCT):
        return Decimal("100")
    if year > max(FREE_ALLOCATION_PCT):
        return Decimal("0")
    return FREE_ALLOCATION_PCT[year]


def get_route(route_id: str) -> Route:
    for route in ROUTES:
        if route.id == route_id:
            return route
    raise KeyError(f"Unknown route id: {route_id!r}")
