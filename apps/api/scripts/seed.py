"""`make demo`: migrations (run separately via alembic) + seed reference data,
a demo user, and 3 demo companies with calculations.

Run: uv run python -m scripts.seed
"""

from __future__ import annotations

import asyncio
import uuid
from dataclasses import asdict
from decimal import Decimal

from sqlalchemy import select

from app.db import SessionLocal
from app.models import Calculation, Company, EmissionFactor, ReferenceItem, User
from app.models import CalculationInput as CalculationInputRow
from app.models import CalculationResult as CalculationResultRow
from app.security import hash_password
from ecobalance_core import reference
from ecobalance_core.engine import calculate
from ecobalance_core.models import CalculationInput, ElectricityInput, RawMaterialInput

DEMO_USER_EMAIL = "demo@ecobalance-demo.ru"
DEMO_USER_PASSWORD = "demo12345"


async def _seed_emission_factors(db) -> None:  # type: ignore[no-untyped-def]
    existing = (await db.execute(select(EmissionFactor.id).limit(1))).first()
    if existing is not None:
        return

    for fuel in reference.FUELS:
        db.add(
            EmissionFactor(
                category="fuel",
                ref_id=fuel.id,
                name=fuel.name,
                value={
                    "ncv_mj_per_unit": str(fuel.ncv_mj_per_unit),
                    "ef_kg_co2_per_gj": str(fuel.ef_kg_co2_per_gj),
                    "unit": fuel.unit,
                },
                source=fuel.source,
                year=fuel.year,
                is_demo=fuel.is_demo,
            )
        )
    for material in reference.RAW_MATERIALS:
        db.add(
            EmissionFactor(
                category="raw_material",
                ref_id=material.id,
                name=material.name,
                value={"ef_kg_co2_per_t": str(material.ef_kg_co2_per_t)},
                source=material.source,
                year=material.year,
                is_demo=material.is_demo,
            )
        )
    for region in reference.REGIONS:
        db.add(
            EmissionFactor(
                category="region",
                ref_id=region.id,
                name=region.name,
                value={"ef_el_kg_co2_per_mwh": str(region.ef_el_kg_co2_per_mwh)},
                source=region.source,
                year=region.year,
                is_demo=region.is_demo,
            )
        )
    for mode in reference.TRANSPORT_MODES:
        db.add(
            EmissionFactor(
                category="transport",
                ref_id=mode.id,
                name=mode.name,
                value={"ef_kg_co2_per_tkm": str(mode.ef_kg_co2_per_tkm)},
                source=mode.source,
                year=mode.year,
                is_demo=mode.is_demo,
            )
        )
    for treatment in reference.WASTE_TREATMENTS:
        db.add(
            EmissionFactor(
                category="waste",
                ref_id=treatment.id,
                name=treatment.name,
                value={"ef_kg_co2_per_t": str(treatment.ef_kg_co2_per_t)},
                source=treatment.source,
                year=treatment.year,
                is_demo=treatment.is_demo,
            )
        )
    for product in reference.PRODUCTS:
        db.add(ReferenceItem(kind="product", ref_id=product.id, data=asdict(product)))
    for route in reference.ROUTES:
        db.add(ReferenceItem(kind="route", ref_id=route.id, data=asdict(route)))


_DEMO_CALCULATIONS: list[tuple[str, CalculationInput]] = [
    (
        "Аммиак — SMR, демо",
        CalculationInput(
            product_id="ammonia",
            route_id="ammonia__smr",
            raw_materials=[
                RawMaterialInput(
                    material_id="natural_gas_feedstock", quantity_t_per_unit=Decimal("0.6")
                )
            ],
            electricity=ElectricityInput(
                consumption_mwh_per_unit=Decimal("0.2"), region_id="oes_center"
            ),
        ),
    ),
    (
        "ПВХ — суспензионный, демо",
        CalculationInput(
            product_id="pvc",
            route_id="pvc__suspension",
            raw_materials=[
                RawMaterialInput(
                    material_id="ethylene_feedstock", quantity_t_per_unit=Decimal("0.45")
                ),
                RawMaterialInput(
                    material_id="chlorine_feedstock", quantity_t_per_unit=Decimal("0.58")
                ),
            ],
            electricity=ElectricityInput(
                consumption_mwh_per_unit=Decimal("0.35"), region_id="oes_ural"
            ),
        ),
    ),
    (
        "Мочевина — демо",
        CalculationInput(
            product_id="urea",
            route_id="urea__ammonia_co2_synthesis",
            actual_output_t=Decimal("100"),
            raw_materials=[
                RawMaterialInput(
                    material_id="ammonia_feedstock", quantity_t_per_unit=Decimal("0.57")
                ),
                RawMaterialInput(material_id="co2_feedstock", quantity_t_per_unit=Decimal("0.75")),
            ],
            electricity=ElectricityInput(
                consumption_mwh_per_unit=Decimal("0.05"), region_id="oes_center"
            ),
        ),
    ),
]


async def _seed_demo_user_and_companies(db) -> None:  # type: ignore[no-untyped-def]
    existing_user = (
        await db.execute(select(User).where(User.email == DEMO_USER_EMAIL))
    ).scalar_one_or_none()
    if existing_user is not None:
        return

    for index, (calc_name, core_input) in enumerate(_DEMO_CALCULATIONS, start=1):
        company = Company(
            name=f"ООО «Демо-Химия {index}»",
            inn="7700000000",
            industry="Нефтехимия",
            size="medium",
            region_id="oes_center",
        )
        db.add(company)
        await db.flush()

        user_email = DEMO_USER_EMAIL if index == 1 else f"demo{index}@ecobalance-demo.ru"
        user_password = DEMO_USER_PASSWORD if index == 1 else uuid.uuid4().hex
        user = User(
            email=user_email,
            hashed_password=hash_password(user_password),
            role="company_user",
            company_id=company.id,
        )
        db.add(user)
        await db.flush()

        calculation = Calculation(
            company_id=company.id,
            created_by=user.id,
            name=calc_name,
            status="final",
        )
        db.add(calculation)
        await db.flush()

        db.add(
            CalculationInputRow(
                calculation_id=calculation.id, data=core_input.model_dump(mode="json")
            )
        )
        result = calculate(core_input)
        db.add(
            CalculationResultRow(calculation_id=calculation.id, data=result.model_dump(mode="json"))
        )


async def main() -> None:
    async with SessionLocal() as db:
        await _seed_emission_factors(db)
        await _seed_demo_user_and_companies(db)
        await db.commit()
    print(f"Seed complete. Demo login: {DEMO_USER_EMAIL} / {DEMO_USER_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(main())
