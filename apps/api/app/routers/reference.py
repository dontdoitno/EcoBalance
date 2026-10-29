"""Read-only reference data for the frontend (products, routes, fuels,
raw materials, regions, transport modes, waste treatments, measures).
No auth required — this is public catalog data, not company data.
"""

from __future__ import annotations

from dataclasses import asdict
from typing import Any

from fastapi import APIRouter

from ecobalance_core import measures, reference

router = APIRouter(prefix="/reference", tags=["reference"])


@router.get("/products")
def list_products() -> list[dict[str, Any]]:
    return [asdict(product) for product in reference.PRODUCTS]


@router.get("/routes")
def list_routes() -> list[dict[str, Any]]:
    return [asdict(route) for route in reference.ROUTES]


@router.get("/fuels")
def list_fuels() -> list[dict[str, Any]]:
    return [asdict(fuel) for fuel in reference.FUELS]


@router.get("/raw-materials")
def list_raw_materials() -> list[dict[str, Any]]:
    return [asdict(material) for material in reference.RAW_MATERIALS]


@router.get("/regions")
def list_regions() -> list[dict[str, Any]]:
    return [asdict(region) for region in reference.REGIONS]


@router.get("/transport-modes")
def list_transport_modes() -> list[dict[str, Any]]:
    return [asdict(mode) for mode in reference.TRANSPORT_MODES]


@router.get("/waste-treatments")
def list_waste_treatments() -> list[dict[str, Any]]:
    return [asdict(treatment) for treatment in reference.WASTE_TREATMENTS]


@router.get("/measures")
def list_measures() -> dict[str, Any]:
    return measures.load_catalog()
