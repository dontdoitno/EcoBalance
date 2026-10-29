"""Hotspot ranking and data-quality flags (PROMPT_CLAUDE_CODE.md §7).

Thresholds live in config/hotspots.yml, not as magic numbers in code.
"""

from __future__ import annotations

from decimal import Decimal
from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml

from ecobalance_core.models import BreakdownItem, DataQualityInput, Hotspot, HotspotFlag

_CONFIG_PATH = Path(__file__).resolve().parents[1] / "config" / "hotspots.yml"


@lru_cache(maxsize=1)
def load_config() -> dict[str, Any]:
    with _CONFIG_PATH.open("r", encoding="utf-8") as config_file:
        config: dict[str, Any] = yaml.safe_load(config_file)
    return config


def rate_breakdown(breakdown: list[BreakdownItem]) -> list[Hotspot]:
    config = load_config()
    critical = Decimal(str(config["thresholds"]["critical_pct"]))
    significant = Decimal(str(config["thresholds"]["significant_pct"]))

    hotspots: list[Hotspot] = []
    for item in breakdown:
        if item.percentage >= critical:
            rating: str = "critical"
        elif item.percentage >= significant:
            rating = "significant"
        else:
            rating = "low"
        hotspots.append(
            Hotspot(
                category=item.category,
                label=item.label,
                scope=item.scope,
                contribution_pct=item.percentage,
                rating=rating,  # type: ignore[arg-type]
                flags=[],
            )
        )
    return hotspots


def data_quality_flags(
    data_quality: DataQualityInput | None, *, is_demo: bool
) -> tuple[Decimal | None, list[HotspotFlag]]:
    config = load_config()
    flags: list[HotspotFlag] = []
    score: Decimal | None = None

    if data_quality is not None:
        min_primary = Decimal(str(config["quality_flags"]["primary_data_share_min_pct"]))
        max_uncertainty = Decimal(str(config["quality_flags"]["uncertainty_max_pct"]))

        if data_quality.primary_data_share_pct < min_primary:
            flags.append(
                HotspotFlag(
                    code="low_primary_data_share",
                    message=(
                        f"Доля первичных данных ({data_quality.primary_data_share_pct}%) "
                        f"ниже порога {min_primary}%."
                    ),
                    severity="warning",
                )
            )
        if data_quality.uncertainty_pct > max_uncertainty:
            flags.append(
                HotspotFlag(
                    code="high_uncertainty",
                    message=(
                        f"Неопределённость ({data_quality.uncertainty_pct}%) "
                        f"выше порога {max_uncertainty}%."
                    ),
                    severity="warning",
                )
            )
        score = max(
            Decimal("0"),
            min(
                Decimal("100"),
                data_quality.primary_data_share_pct - data_quality.uncertainty_pct / 2,
            ),
        )

    if is_demo:
        flags.append(
            HotspotFlag(
                code="demo_factors",
                message=(
                    "Расчёт использует демонстрационные коэффициенты выбросов "
                    "(is_demo=true) — не верифицированные данные, не для подачи "
                    "в реальную CBAM-декларацию."
                ),
                severity="warning",
            )
        )

    return score, flags


def scope3_chemical_hint(scope3_pct_of_total: Decimal) -> HotspotFlag | None:
    config = load_config()
    threshold = Decimal(str(config["scope3_chemical_hint_pct"]))
    if scope3_pct_of_total > threshold:
        return HotspotFlag(
            code="scope3_dominant",
            message=(
                f"Scope 3 составляет {scope3_pct_of_total:.0f}% от следа — выше, чем в среднем "
                f"по химической отрасли (ориентир ~{threshold:.0f}%)."
            ),
            severity="info",
        )
    return None
