from __future__ import annotations

from typing import Annotated

import jwt
from fastapi import APIRouter, Cookie, HTTPException, Request, Response, status

from app.config import settings
from app.deps import CurrentUser, DbSession, get_user_by_email, limiter
from app.models import Company, User
from app.schemas import LoginIn, RegisterIn, UserOut
from app.security import (
    clear_session_cookies,
    create_access_token,
    decode_token,
    hash_password,
    set_session_cookies,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def register(request: Request, response: Response, body: RegisterIn, db: DbSession) -> User:
    existing = await get_user_by_email(db, body.email)
    if existing is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Пользователь с таким email уже существует")

    company = Company(name=body.company_name)
    db.add(company)
    await db.flush()

    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        role="company_user",
        company_id=company.id,
    )
    db.add(user)
    await db.commit()

    set_session_cookies(response, user.id)
    return user


@router.post("/login", response_model=UserOut)
@limiter.limit("10/minute")
async def login(request: Request, response: Response, body: LoginIn, db: DbSession) -> User:
    user = await get_user_by_email(db, body.email)
    if user is None or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Неверный email или пароль")

    set_session_cookies(response, user.id)
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response) -> None:
    clear_session_cookies(response)


@router.post("/refresh", response_model=UserOut)
@limiter.limit("20/minute")
async def refresh(
    request: Request,
    response: Response,
    db: DbSession,
    refresh_token: Annotated[str | None, Cookie(alias=settings.api_refresh_cookie_name)] = None,
) -> User:
    if refresh_token is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Отсутствует refresh-токен")
    try:
        user_id = decode_token(refresh_token, "refresh")
    except jwt.PyJWTError:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "Недействительный refresh-токен"
        ) from None

    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Пользователь не найден")

    # Rotate: issue a new access token; refresh token itself is reissued by set_session_cookies.
    access_token = create_access_token(user.id)
    response.set_cookie(
        settings.api_session_cookie_name,
        access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.access_token_ttl_minutes * 60,
    )
    return user


@router.get("/me", response_model=UserOut)
async def me(user: CurrentUser) -> User:
    return user
