"""Password hashing (argon2) and JWT access/refresh tokens in httpOnly cookies."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta
from typing import Any, Literal

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import Response

from app.config import settings

_hasher = PasswordHasher()

TokenType = Literal["access", "refresh"]


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    try:
        return _hasher.verify(hashed, password)
    except VerifyMismatchError:
        return False


def _create_token(user_id: uuid.UUID, token_type: TokenType, ttl: timedelta) -> str:
    now = datetime.now(UTC)
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "type": token_type,
        "iat": now,
        "exp": now + ttl,
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, settings.api_secret_key, algorithm="HS256")


def create_access_token(user_id: uuid.UUID) -> str:
    return _create_token(user_id, "access", timedelta(minutes=settings.access_token_ttl_minutes))


def create_refresh_token(user_id: uuid.UUID) -> str:
    return _create_token(user_id, "refresh", timedelta(days=settings.refresh_token_ttl_days))


def decode_token(token: str, expected_type: TokenType) -> uuid.UUID:
    payload = jwt.decode(token, settings.api_secret_key, algorithms=["HS256"])
    if payload.get("type") != expected_type:
        raise jwt.InvalidTokenError(f"Expected a {expected_type} token")
    return uuid.UUID(payload["sub"])


def set_session_cookies(response: Response, user_id: uuid.UUID) -> None:
    access_token = create_access_token(user_id)
    refresh_token = create_refresh_token(user_id)
    response.set_cookie(
        settings.api_session_cookie_name,
        access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.access_token_ttl_minutes * 60,
    )
    response.set_cookie(
        settings.api_refresh_cookie_name,
        refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.refresh_token_ttl_days * 24 * 60 * 60,
    )


def clear_session_cookies(response: Response) -> None:
    response.delete_cookie(settings.api_session_cookie_name)
    response.delete_cookie(settings.api_refresh_cookie_name)
