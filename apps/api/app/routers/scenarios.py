from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, status
from pydantic import ValidationError
from sqlalchemy import select

from app.deps import CurrentUser, DbSession
from app.models import Calculation, Scenario, ScenarioMeasure
from app.models import CalculationInput as CalculationInputRow
from app.schemas import ScenarioCreate, ScenarioOut
from ecobalance_core.models import CalculationInput as CoreCalculationInput
from ecobalance_core.scenario import run_scenario

router = APIRouter(prefix="/calculations/{calculation_id}/scenarios", tags=["scenarios"])


async def _get_own_calculation(
    db: DbSession, user: CurrentUser, calculation_id: uuid.UUID
) -> Calculation:
    calculation = await db.get(Calculation, calculation_id)
    if calculation is None or calculation.company_id != user.company_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Расчёт не найден")
    return calculation


def _to_out(scenario: Scenario, calculation_id: uuid.UUID, measure_ids: list[str]) -> ScenarioOut:
    data = scenario.result_data or {}
    return ScenarioOut(
        id=scenario.id,
        calculation_id=calculation_id,
        name=scenario.name,
        measure_ids=measure_ids,
        baseline=data.get("baseline", {}),
        scenario=data.get("scenario", {}),
        delta_pcf_full_kg_co2_per_unit=data.get("delta_pcf_full_kg_co2_per_unit", 0.0),
        delta_pcf_full_pct=data.get("delta_pcf_full_pct", 0.0),
        delta_cbam_embedded_kg_co2_per_unit=data.get("delta_cbam_embedded_kg_co2_per_unit"),
    )


@router.get("", response_model=list[ScenarioOut])
async def list_scenarios(
    calculation_id: uuid.UUID, user: CurrentUser, db: DbSession
) -> list[ScenarioOut]:
    calculation = await _get_own_calculation(db, user, calculation_id)
    result = await db.execute(select(Scenario).where(Scenario.calculation_id == calculation.id))
    scenarios = result.scalars().all()

    out = []
    for scenario in scenarios:
        measures_result = await db.execute(
            select(ScenarioMeasure).where(ScenarioMeasure.scenario_id == scenario.id)
        )
        measure_ids = [m.measure_id for m in measures_result.scalars().all()]
        out.append(_to_out(scenario, calculation.id, measure_ids))
    return out


@router.post("", response_model=ScenarioOut, status_code=status.HTTP_201_CREATED)
async def create_scenario(
    calculation_id: uuid.UUID, body: ScenarioCreate, user: CurrentUser, db: DbSession
) -> ScenarioOut:
    calculation = await _get_own_calculation(db, user, calculation_id)

    input_result = await db.execute(
        select(CalculationInputRow).where(CalculationInputRow.calculation_id == calculation.id)
    )
    input_row = input_result.scalar_one_or_none()
    if input_row is None or not input_row.data:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Нет данных для построения сценария")

    try:
        core_input = CoreCalculationInput.model_validate(input_row.data)
    except ValidationError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, exc.errors()) from None

    try:
        scenario_result = run_scenario(core_input, body.measure_ids, body.assumption_overrides)
    except KeyError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Неизвестная мера: {exc}") from None

    result_data: dict[str, Any] = {
        "baseline": scenario_result.baseline.model_dump(mode="json"),
        "scenario": scenario_result.scenario.model_dump(mode="json"),
        "delta_pcf_full_kg_co2_per_unit": float(scenario_result.delta_pcf_full_kg_co2_per_unit),
        "delta_pcf_full_pct": float(scenario_result.delta_pcf_full_pct),
        "delta_cbam_embedded_kg_co2_per_unit": (
            float(scenario_result.delta_cbam_embedded_kg_co2_per_unit)
            if scenario_result.delta_cbam_embedded_kg_co2_per_unit is not None
            else None
        ),
    }

    scenario = Scenario(calculation_id=calculation.id, name=body.name, result_data=result_data)
    db.add(scenario)
    await db.flush()

    for measure_id in body.measure_ids:
        db.add(
            ScenarioMeasure(
                scenario_id=scenario.id,
                measure_id=measure_id,
                assumptions=body.assumption_overrides.get(measure_id, {}),
            )
        )

    await db.commit()
    return _to_out(scenario, calculation.id, body.measure_ids)
