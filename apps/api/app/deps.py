"""Shared FastAPI dependencies: DB session, current user, rate limiter."""

from __future__ import annotations

from typing import Annotated

import jwt
from fastapi import Cookie, Depends, HTTPException, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_db
from app.models import User
from app.security import decode_token

limiter = Limiter(key_func=get_remote_address)

DbSession = Annotated[AsyncSession, Depends(get_db)]


def _unauthorized() -> HTTPException:
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Не авторизован")


async def current_user(
    db: DbSession,
    session_token: Annotated[str | None, Cookie(alias=settings.api_session_cookie_name)] = None,
) -> User:
    if session_token is None:
        raise _unauthorized()
    try:
        user_id = decode_token(session_token, "access")
    except jwt.PyJWTError:
        raise _unauthorized() from None

    user = await db.get(User, user_id)
    if user is None:
        raise _unauthorized()
    return user


CurrentUser = Annotated[User, Depends(current_user)]


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()
