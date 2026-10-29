"""SQLAlchemy ORM models (PROMPT_CLAUDE_CODE.md §6 — minimum data model)."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def _uuid_pk() -> Mapped[uuid.UUID]:
    return mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[uuid.UUID] = _uuid_pk()
    name: Mapped[str] = mapped_column(String(255))
    inn: Mapped[str | None] = mapped_column(String(12), nullable=True)
    industry: Mapped[str | None] = mapped_column(String(255), nullable=True)
    size: Mapped[str | None] = mapped_column(String(50), nullable=True)
    region_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    users: Mapped[list[User]] = relationship(back_populates="company")
    installations: Mapped[list[Installation]] = relationship(back_populates="company")
    calculations: Mapped[list[Calculation]] = relationship(back_populates="company")


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = _uuid_pk()
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), default="company_user")
    company_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("companies.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    company: Mapped[Company] = relationship(back_populates="users")


class Installation(Base):
    __tablename__ = "installations"

    id: Mapped[uuid.UUID] = _uuid_pk()
    company_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("companies.id"))
    name: Mapped[str] = mapped_column(String(255))
    region_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    company: Mapped[Company] = relationship(back_populates="installations")


class Calculation(Base):
    __tablename__ = "calculations"

    id: Mapped[uuid.UUID] = _uuid_pk()
    company_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("companies.id"))
    installation_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("installations.id"), nullable=True
    )
    created_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))

    name: Mapped[str] = mapped_column(String(255), default="Новый расчёт")
    status: Mapped[str] = mapped_column(String(20), default="draft")  # draft | final
    version: Mapped[int] = mapped_column(default=1)
    supersedes_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("calculations.id"), nullable=True
    )

    factor_version: Mapped[str] = mapped_column(String(50), default="demo-2024")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    finalized_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    company: Mapped[Company] = relationship(back_populates="calculations")
    input: Mapped[CalculationInput | None] = relationship(
        back_populates="calculation", uselist=False, cascade="all, delete-orphan"
    )
    result: Mapped[CalculationResult | None] = relationship(
        back_populates="calculation", uselist=False, cascade="all, delete-orphan"
    )
    scenarios: Mapped[list[Scenario]] = relationship(
        back_populates="calculation", cascade="all, delete-orphan"
    )
    reports: Mapped[list[Report]] = relationship(
        back_populates="calculation", cascade="all, delete-orphan"
    )


class CalculationInput(Base):
    """JSONB-stored, Pydantic-validated (ecobalance_core.models.CalculationInput) draft input."""

    __tablename__ = "calculation_inputs"

    id: Mapped[uuid.UUID] = _uuid_pk()
    calculation_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("calculations.id"), unique=True)
    data: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    calculation: Mapped[Calculation] = relationship(back_populates="input")


class CalculationResult(Base):
    """JSONB-stored ecobalance_core.models.CalculationResult, computed at request time."""

    __tablename__ = "calculation_results"

    id: Mapped[uuid.UUID] = _uuid_pk()
    calculation_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("calculations.id"), unique=True)
    data: Mapped[dict[str, Any]] = mapped_column(JSONB)
    computed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    calculation: Mapped[Calculation] = relationship(back_populates="result")


class Scenario(Base):
    __tablename__ = "scenarios"

    id: Mapped[uuid.UUID] = _uuid_pk()
    calculation_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("calculations.id"))
    name: Mapped[str] = mapped_column(String(255), default="Сценарий")
    result_data: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    calculation: Mapped[Calculation] = relationship(back_populates="scenarios")
    measures: Mapped[list[ScenarioMeasure]] = relationship(
        back_populates="scenario", cascade="all, delete-orphan"
    )


class ScenarioMeasure(Base):
    __tablename__ = "scenario_measures"

    id: Mapped[uuid.UUID] = _uuid_pk()
    scenario_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("scenarios.id"))
    measure_id: Mapped[str] = mapped_column(String(100))
    assumptions: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)

    scenario: Mapped[Scenario] = relationship(back_populates="measures")


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = _uuid_pk()
    calculation_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("calculations.id"))
    scenario_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("scenarios.id"), nullable=True)
    report_type: Mapped[str] = mapped_column(String(20))  # pcf | cbam | scenario
    report_format: Mapped[str] = mapped_column(String(10))  # pdf | xlsx | json
    file_path: Mapped[str] = mapped_column(String(1000))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    calculation: Mapped[Calculation] = relationship(back_populates="reports")


class EmissionFactor(Base):
    """Versioned snapshot of ecobalance_core.reference entries, for API exposure."""

    __tablename__ = "emission_factors"

    id: Mapped[uuid.UUID] = _uuid_pk()
    category: Mapped[str] = mapped_column(
        String(50)
    )  # fuel | raw_material | region | transport | waste
    ref_id: Mapped[str] = mapped_column(String(100))
    name: Mapped[str] = mapped_column(String(255))
    value: Mapped[dict[str, Any]] = mapped_column(JSONB)
    source: Mapped[str] = mapped_column(String(100))
    year: Mapped[int] = mapped_column()
    is_demo: Mapped[bool] = mapped_column(default=True)


class ReferenceItem(Base):
    """Versioned snapshot of ecobalance_core.reference products/routes/CBAM mapping."""

    __tablename__ = "reference_items"

    id: Mapped[uuid.UUID] = _uuid_pk()
    kind: Mapped[str] = mapped_column(String(50))  # product | route
    ref_id: Mapped[str] = mapped_column(String(100))
    data: Mapped[dict[str, Any]] = mapped_column(JSONB)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = _uuid_pk()
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(100))
    entity_type: Mapped[str] = mapped_column(String(50))
    entity_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    details: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
