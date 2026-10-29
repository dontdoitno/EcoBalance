"""Application settings, read from environment variables (.env in dev)."""

from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://ecobalance:change-me@localhost:5432/ecobalance"
    api_secret_key: str = "change-me"
    api_session_cookie_name: str = "ecobalance_session"
    api_refresh_cookie_name: str = "ecobalance_refresh"
    api_cors_origins: str = "http://localhost:3000"

    access_token_ttl_minutes: int = 15
    refresh_token_ttl_days: int = 30

    reports_dir: str = "/tmp/ecobalance-reports"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.api_cors_origins.split(",") if origin.strip()]


settings = Settings()
