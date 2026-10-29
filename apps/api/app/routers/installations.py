from __future__ import annotations

import uuid

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.deps import CurrentUser, DbSession
from app.models import Installation
from app.schemas import InstallationIn, InstallationOut

router = APIRouter(prefix="/installations", tags=["installations"])


async def _get_own_installation(
    db: DbSession, user: CurrentUser, installation_id: uuid.UUID
) -> Installation:
    installation = await db.get(Installation, installation_id)
    if installation is None or installation.company_id != user.company_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Площадка не найдена")
    return installation


@router.get("", response_model=list[InstallationOut])
async def list_installations(user: CurrentUser, db: DbSession) -> list[Installation]:
    result = await db.execute(
        select(Installation).where(Installation.company_id == user.company_id)
    )
    return list(result.scalars().all())


@router.post("", response_model=InstallationOut, status_code=status.HTTP_201_CREATED)
async def create_installation(
    body: InstallationIn, user: CurrentUser, db: DbSession
) -> Installation:
    installation = Installation(company_id=user.company_id, **body.model_dump())
    db.add(installation)
    await db.commit()
    await db.refresh(installation)
    return installation


@router.patch("/{installation_id}", response_model=InstallationOut)
async def update_installation(
    installation_id: uuid.UUID, body: InstallationIn, user: CurrentUser, db: DbSession
) -> Installation:
    installation = await _get_own_installation(db, user, installation_id)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(installation, field, value)
    await db.commit()
    await db.refresh(installation)
    return installation
