"""Application configuration loaded from environment variables."""
from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

    # App
    APP_NAME: str = "Craftik API"
    ENVIRONMENT: str = "development"
    API_V1_PREFIX: str = "/api/v1"

    # Database
    # Render / Heroku sometimes provide `postgres://…` — SQLAlchemy needs `postgresql://…`,
    # so we normalize below via the property.
    DATABASE_URL: str = "postgresql://craftik:craftik@localhost:5432/craftik"

    # Security
    SECRET_KEY: str = "dev-only-secret-change-me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    JWT_ALGORITHM: str = "HS256"

    # CORS (comma-separated in env)
    # Prod: set to your frontend URL, e.g. https://craftik-web.onrender.com
    CORS_ORIGINS: str = "http://localhost:3000"

    # Startup behaviour
    MIGRATE_ON_STARTUP: bool = False  # prod: run alembic upgrade head at boot
    SEED_ON_STARTUP: bool = True       # dev: load demo data; disable in prod

    def model_post_init(self, __context) -> None:  # noqa: D401
        # Normalize Postgres URL scheme: Render/Heroku produce postgres://…
        # but SQLAlchemy 2.x requires postgresql://…
        if self.DATABASE_URL.startswith("postgres://"):
            self.DATABASE_URL = "postgresql://" + self.DATABASE_URL[len("postgres://"):]

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
