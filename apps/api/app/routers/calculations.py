from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, HTTPException, status
from pydantic import ValidationError
from sqlalchemy import select

from app.deps import CurrentUser, DbSession
from app.models import Calculation
from app.models import CalculationInput as CalculationInputRow
from app.models import CalculationResult as CalculationResultRow
from app.schemas import CalculationCreate, CalculationSummary
from ecobalance_core.engine import calculate as run_engine
from ecobalance_core.models import CalculationInput as CoreCalculationInput

router = APIRouter(prefix="/calculations", tags=["calculations"])


async def _get_own_calculation(
    db: DbSession, user: CurrentUser, calculation_id: uuid.UUID
) -> Calculation:
    calculation = await db.get(Calculation, calculation_id)
    if calculation is None or calculation.company_id != user.company_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Расчёт не найден")
    return calculation


def _summary(calculation: Calculation, result_data: dict[str, Any] | None) -> CalculationSummary:
    pcf = None
    if result_data is not None:
        pcf = float(result_data["pcf_full_kg_co2_per_unit"])
    return CalculationSummary(
        id=calculation.id,
        name=calculation.name,
        status=calculation.status,
        version=calculation.version,
        created_at=calculation.created_at,
        finalized_at=calculation.finalized_at,
        pcf_full_kg_co2_per_unit=pcf,
    )


@router.get("", response_model=list[CalculationSummary])
async def list_calculations(user: CurrentUser, db: DbSession) -> list[CalculationSummary]:
    result = await db.execute(
        select(Calculation, CalculationResultRow)
        .outerjoin(CalculationResultRow, CalculationResultRow.calculation_id == Calculation.id)
        .where(Calculation.company_id == user.company_id)
        .order_by(Calculation.created_at.desc())
    )
    return [
        _summary(calculation, result_row.data if result_row is not None else None)
        for calculation, result_row in result.all()
    ]


@router.post("", response_model=CalculationSummary, status_code=status.HTTP_201_CREATED)
async def create_calculation(
    body: CalculationCreate, user: CurrentUser, db: DbSession
) -> CalculationSummary:
    calculation = Calculation(
        company_id=user.company_id,
        installation_id=body.installation_id,
        created_by=user.id,
        name=body.name,
    )
    db.add(calculation)
    await db.flush()

    input_row = CalculationInputRow(calculation_id=calculation.id, data={})
    db.add(input_row)
    await db.commit()
    return _summary(calculation, None)


@router.get("/{calculation_id}")
async def get_calculation(
    calculation_id: uuid.UUID, user: CurrentUser, db: DbSession
) -> dict[str, Any]:
    calculation = await _get_own_calculation(db, user, calculation_id)

    input_result = await db.execute(
        select(CalculationInputRow).where(CalculationInputRow.calculation_id == calculation.id)
    )
    input_row = input_result.scalar_one_or_none()

    result_result = await db.execute(
        select(CalculationResultRow).where(CalculationResultRow.calculation_id == calculation.id)
    )
    result_row = result_result.scalar_one_or_none()

    return {
        "id": calculation.id,
        "name": calculation.name,
        "status": calculation.status,
        "version": calculation.version,
        "created_at": calculation.created_at,
        "finalized_at": calculation.finalized_at,
        "input": input_row.data if input_row is not None else {},
        "result": result_row.data if result_row is not None else None,
    }


@router.patch("/{calculation_id}")
async def patch_calculation_input(
    calculation_id: uuid.UUID, patch: dict[str, Any], user: CurrentUser, db: DbSession
) -> dict[str, Any]:
    calculation = await _get_own_calculation(db, user, calculation_id)
    if calculation.status == "final":
        raise HTTPException(status.HTTP_409_CONFLICT, "Финализированный расчёт нельзя изменить")

    input_query = await db.execute(
        select(CalculationInputRow).where(CalculationInputRow.calculation_id == calculation.id)
    )
    input_row = input_query.scalar_one_or_none()
    if input_row is None:
        input_row = CalculationInputRow(calculation_id=calculation.id, data={})
        db.add(input_row)

    merged = {**input_row.data, **patch}
    input_row.data = merged

    is_valid = True
    errors: list[dict[str, Any]] = []
    try:
        CoreCalculationInput.model_validate(merged)
    except ValidationError as exc:
        is_valid = False
        errors = [dict(error) for error in exc.errors()]

    await db.commit()
    return {"data": merged, "is_valid": is_valid, "errors": errors}


@router.post("/{calculation_id}/calculate")
async def calculate_calculation(
    calculation_id: uuid.UUID, user: CurrentUser, db: DbSession
) -> dict[str, Any]:
    calculation = await _get_own_calculation(db, user, calculation_id)
    input_query = await db.execute(
        select(CalculationInputRow).where(CalculationInputRow.calculation_id == calculation.id)
    )
    input_row = input_query.scalar_one_or_none()
    if input_row is None or not input_row.data:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Нет данных для расчёта")

    try:
        core_input = CoreCalculationInput.model_validate(input_row.data)
    except ValidationError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, exc.errors()) from None

    core_result = run_engine(core_input)
    result_data = core_result.model_dump(mode="json")

    result_query = await db.execute(
        select(CalculationResultRow).where(CalculationResultRow.calculation_id == calculation.id)
    )
    result_row = result_query.scalar_one_or_none()
    if result_row is None:
        result_row = CalculationResultRow(calculation_id=calculation.id, data=result_data)
        db.add(result_row)
    else:
        result_row.data = result_data

    await db.commit()
    return result_data


@router.post("/{calculation_id}/finalize", response_model=CalculationSummary)
async def finalize_calculation(
    calculation_id: uuid.UUID, user: CurrentUser, db: DbSession
) -> CalculationSummary:
    calculation = await _get_own_calculation(db, user, calculation_id)
    if calculation.status == "final":
        raise HTTPException(status.HTTP_409_CONFLICT, "Расчёт уже финализирован")

    result = await db.execute(
        select(CalculationResultRow).where(CalculationResultRow.calculation_id == calculation.id)
    )
    result_row = result.scalar_one_or_none()
    if result_row is None:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Сначала выполните расчёт (POST .../calculate)"
        )

    calculation.status = "final"
    calculation.finalized_at = datetime.now(UTC)
    await db.commit()
    return _summary(calculation, result_row.data)
