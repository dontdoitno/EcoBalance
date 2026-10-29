from __future__ import annotations

from fastapi import APIRouter

from app.deps import CurrentUser, DbSession
from app.models import Company
from app.schemas import CompanyIn, CompanyOut

router = APIRouter(prefix="/companies", tags=["companies"])


@router.get("/me", response_model=CompanyOut)
async def get_my_company(user: CurrentUser, db: DbSession) -> Company:
    company = await db.get(Company, user.company_id)
    assert company is not None  # a user always has a company (created together at registration)
    return company


@router.patch("/me", response_model=CompanyOut)
async def update_my_company(body: CompanyIn, user: CurrentUser, db: DbSession) -> Company:
    company = await db.get(Company, user.company_id)
    assert company is not None
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(company, field, value)
    await db.commit()
    await db.refresh(company)
    return company
