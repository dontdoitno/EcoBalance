from __future__ import annotations

import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import select

from app.config import settings
from app.deps import CurrentUser, DbSession
from app.models import Calculation, Company, Report, Scenario
from app.models import CalculationInput as CalculationInputRow
from app.models import CalculationResult as CalculationResultRow
from app.reports import generator
from app.schemas import ReportFormat, ReportType
from ecobalance_core import measures as measures_catalog
from ecobalance_core import reference

router = APIRouter(prefix="/reports", tags=["reports"])

_MEDIA_TYPES = {
    "pdf": "application/pdf",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "json": "application/json",
}


async def _get_own_calculation(
    db: DbSession, user: CurrentUser, calculation_id: uuid.UUID
) -> Calculation:
    calculation = await db.get(Calculation, calculation_id)
    if calculation is None or calculation.company_id != user.company_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Расчёт не найден")
    return calculation


@router.get("/{calculation_id}")
async def get_report(
    calculation_id: uuid.UUID,
    report_type: ReportType,
    report_format: ReportFormat,
    user: CurrentUser,
    db: DbSession,
    scenario_id: uuid.UUID | None = None,
    ets_price_eur_per_t: float = 80.0,
    default_markup_pct: float = 50.0,
) -> Response:
    calculation = await _get_own_calculation(db, user, calculation_id)
    company = await db.get(Company, user.company_id)
    assert company is not None

    input_row_result = await db.execute(
        select(CalculationInputRow).where(CalculationInputRow.calculation_id == calculation.id)
    )
    input_row = input_row_result.scalar_one_or_none()
    product_id = (input_row.data.get("product_id") if input_row else None) or None
    route_id = (input_row.data.get("route_id") if input_row else None) or None
    product = reference.get_product(product_id) if product_id else None
    product_name = product.name if product else "—"
    route_name = route_id or "—"

    result_row_result = await db.execute(
        select(CalculationResultRow).where(CalculationResultRow.calculation_id == calculation.id)
    )
    result_row = result_row_result.scalar_one_or_none()
    if result_row is None:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Сначала выполните расчёт (POST .../calculate)"
        )
    result = result_row.data

    if report_type == "cbam" and not result.get("cbam_applicable", False):
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            result.get("cbam_not_applicable_reason") or "CBAM не применим для этого продукта",
        )

    generated_at = datetime.now(UTC).strftime("%d.%m.%Y %H:%M UTC")

    if report_type == "scenario":
        scenario = await _load_scenario(db, calculation.id, scenario_id)
        baseline = scenario.result_data["baseline"]  # type: ignore[index]
        scenario_result = scenario.result_data["scenario"]  # type: ignore[index]
        measures_meta = _measures_meta()

        payload_for_data_formats = scenario_result
        body = _render_body(
            report_type,
            report_format,
            company_name=company.name,
            product_name=product_name,
            route_name=route_name,
            result=payload_for_data_formats,
            product_id=product_id,
            ets_price_eur_per_t=ets_price_eur_per_t,
            default_markup_pct=default_markup_pct,
            generated_at=generated_at,
            scenario_name=scenario.name,
            baseline=baseline,
            scenario=scenario_result,
            measures_meta=measures_meta,
        )
    else:
        body = _render_body(
            report_type,
            report_format,
            company_name=company.name,
            product_name=product_name,
            route_name=route_name,
            result=result,
            product_id=product_id,
            ets_price_eur_per_t=ets_price_eur_per_t,
            default_markup_pct=default_markup_pct,
            generated_at=generated_at,
            scenario_name=None,
            baseline=None,
            scenario=None,
            measures_meta=None,
        )

    file_path = _write_report_file(calculation.id, report_type, report_format, body)
    db.add(
        Report(
            calculation_id=calculation.id,
            scenario_id=scenario_id,
            report_type=report_type,
            report_format=report_format,
            file_path=str(file_path),
        )
    )
    await db.commit()

    filename = f"ecobalance-{report_type}-{calculation.id}.{report_format}"
    return Response(
        content=body,
        media_type=_MEDIA_TYPES[report_format],
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


async def _load_scenario(
    db: DbSession, calculation_id: uuid.UUID, scenario_id: uuid.UUID | None
) -> Scenario:
    if scenario_id is None:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Укажите scenario_id для отчёта по сценарию"
        )
    scenario = await db.get(Scenario, scenario_id)
    if (
        scenario is None
        or scenario.calculation_id != calculation_id
        or scenario.result_data is None
    ):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Сценарий не найден")
    return scenario


def _measures_meta() -> list[dict[str, str]]:
    catalog = measures_catalog.load_catalog()
    return [
        {
            "title": meta["title"],
            "scope": meta["scope"],
            "complexity_label": meta["complexity_label"],
            "payback": meta["payback"],
        }
        for meta in catalog.values()
    ]


def _render_body(
    report_type: str,
    report_format: str,
    *,
    company_name: str,
    product_name: str,
    route_name: str,
    result: dict[str, Any] | None,
    product_id: str | None,
    ets_price_eur_per_t: float,
    default_markup_pct: float,
    generated_at: str,
    scenario_name: str | None,
    baseline: dict[str, Any] | None,
    scenario: dict[str, Any] | None,
    measures_meta: list[dict[str, str]] | None,
) -> bytes:
    if report_format == "json":
        assert result is not None
        return generator.render_result_json(
            company_name=company_name, product_name=product_name, result=result
        )
    if report_format == "xlsx":
        assert result is not None
        return generator.render_result_xlsx(
            company_name=company_name, product_name=product_name, result=result
        )

    if report_type == "pcf":
        assert result is not None
        return generator.render_pcf_pdf(
            company_name=company_name,
            product_name=product_name,
            result=result,
            generated_at=generated_at,
        )
    if report_type == "cbam":
        assert result is not None and product_id is not None
        return generator.render_cbam_pdf(
            company_name=company_name,
            product_name=product_name,
            product_id=product_id,
            route_name=route_name,
            period="—",
            result=result,
            ets_price_eur_per_t=ets_price_eur_per_t,
            default_markup_pct=default_markup_pct,
            generated_at=generated_at,
        )
    assert (
        scenario_name is not None
        and baseline is not None
        and scenario is not None
        and measures_meta is not None
    )
    return generator.render_scenario_pdf(
        company_name=company_name,
        product_name=product_name,
        scenario_name=scenario_name,
        baseline=baseline,
        scenario=scenario,
        measures_meta=measures_meta,
        generated_at=generated_at,
    )


def _write_report_file(
    calculation_id: uuid.UUID, report_type: str, report_format: str, body: bytes
) -> Path:
    reports_dir = Path(settings.reports_dir)
    reports_dir.mkdir(parents=True, exist_ok=True)
    file_path = reports_dir / f"{calculation_id}-{report_type}-{uuid.uuid4().hex}.{report_format}"
    file_path.write_bytes(body)
    return file_path
