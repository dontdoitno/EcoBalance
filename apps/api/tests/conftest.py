"""Test configuration: points the app at a disposable test database and
recreates the schema before every test via SQLAlchemy metadata (not
Alembic — Alembic is the production migration path; tests want a fast,
always-clean slate).

Requires a reachable Postgres (e.g. `docker compose up -d db`), with
TEST_DATABASE_URL overriding the default if the dev DB isn't at
localhost:5432.
"""

from __future__ import annotations

import os

os.environ.setdefault(
    "DATABASE_URL",
    os.environ.get(
        "TEST_DATABASE_URL",
        "postgresql+asyncpg://ecobalance:admin_ecobalance@localhost:5432/ecobalance_test",
    ),
)
os.environ.setdefault("API_SECRET_KEY", "test-secret-key-not-for-production")

from collections.abc import AsyncIterator

import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.db import Base, engine
from app.main import app


@pytest_asyncio.fixture(autouse=True)
async def _reset_schema() -> AsyncIterator[None]:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
        await connection.run_sync(Base.metadata.create_all)
    yield


@pytest_asyncio.fixture
async def client() -> AsyncIterator[AsyncClient]:
    transport = ASGITransport(app=app)
    # https:// (not http://) so the httpx cookie jar honors our Secure
    # session/refresh cookies the same way a real browser would — the
    # ASGITransport never makes a real network call, so the scheme here
    # only affects cookie-jar bookkeeping, not where requests actually go.
    async with AsyncClient(transport=transport, base_url="https://test") as async_client:
        yield async_client
