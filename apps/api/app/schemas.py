"""API request/response schemas.

Calculation input/result bodies reuse `ecobalance_core.models` directly —
the methodology's types are the API's types, so there is exactly one
definition of what a calculation input looks like.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, EmailStr, Field


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    company_name: str = Field(min_length=1)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    role: str
    company_id: uuid.UUID

    model_config = {"from_attributes": True}


class CompanyIn(BaseModel):
    name: str = Field(min_length=1)
    inn: str | None = None
    industry: str | None = None
    size: str | None = None
    region_id: str | None = None


class CompanyOut(CompanyIn):
    id: uuid.UUID

    model_config = {"from_attributes": True}


class InstallationIn(BaseModel):
    name: str = Field(min_length=1)
    region_id: str | None = None
    address: str | None = None


class InstallationOut(InstallationIn):
    id: uuid.UUID
    company_id: uuid.UUID

    model_config = {"from_attributes": True}


class CalculationCreate(BaseModel):
    name: str = "Новый расчёт"
    installation_id: uuid.UUID | None = None


class CalculationSummary(BaseModel):
    id: uuid.UUID
    name: str
    status: str
    version: int
    created_at: datetime
    finalized_at: datetime | None
    pcf_full_kg_co2_per_unit: float | None = None

    model_config = {"from_attributes": True}


class ScenarioCreate(BaseModel):
    name: str = "Сценарий"
    measure_ids: list[str] = Field(default_factory=list)
    assumption_overrides: dict[str, dict[str, Any]] = Field(default_factory=dict)


class ScenarioOut(BaseModel):
    id: uuid.UUID
    calculation_id: uuid.UUID
    name: str
    measure_ids: list[str]
    baseline: dict[str, Any]
    scenario: dict[str, Any]
    delta_pcf_full_kg_co2_per_unit: float
    delta_pcf_full_pct: float
    delta_cbam_embedded_kg_co2_per_unit: float | None


ReportType = Literal["pcf", "cbam", "scenario"]
ReportFormat = Literal["pdf", "xlsx", "json"]
