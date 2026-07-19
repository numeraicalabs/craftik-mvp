"""FastAPI entrypoint.

Modular monolith: each domain has its own router.
When a domain grows enough to warrant a service of its own,
extract by moving `app/api/<domain>.py` + `app/services/<domain>.py` +
`app/models/<domain>.py` to a new service — the shape is already there.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import applications as applications_api
from app.api import auth as auth_api
from app.api import companies as companies_api
from app.api import health as health_api
from app.api import jobs as jobs_api
from app.api import reviews as reviews_api
from app.api import certifications as certifications_api
from app.api import portfolio as portfolio_api
from app.api import portfolio_social as portfolio_social_api
from app.api import messages as messages_api
from app.api import workers as workers_api
from app.core.config import settings
from app.db.session import Base, SessionLocal, engine

# Ensure all models are imported so metadata is complete before create_all.
from app.models import __all__ as _models  # noqa: F401

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("craftik")


def _prepare_database() -> None:
    """Bring the schema up to date.

    - Development (default): `Base.metadata.create_all` — fast and dependency-free.
    - Production: use Alembic migrations. Set MIGRATE_ON_STARTUP=true to run
      `alembic upgrade head` automatically at boot (convenient on Render/Railway
      where you don't have a separate migration step). For serious operations
      you should run migrations from CI/CD instead.
    """
    if settings.MIGRATE_ON_STARTUP:
        logger.info("Running Alembic migrations to head...")
        # Import inside function so alembic isn't required for unit tests.
        from alembic import command
        from alembic.config import Config as AlembicConfig

        # Point Alembic at the ini file next to /app when running in Docker.
        alembic_cfg = AlembicConfig("alembic.ini")
        alembic_cfg.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
        command.upgrade(alembic_cfg, "head")
    else:
        logger.info("Creating tables via metadata.create_all (dev mode)...")
        Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        _prepare_database()
    except Exception as e:  # noqa: BLE001
        logger.exception("Database preparation failed: %s", e)
        raise

    if settings.SEED_ON_STARTUP:
        from app.seed import seed
        db = SessionLocal()
        try:
            seed(db)
            logger.info("Demo data ready.")
        except Exception as e:  # noqa: BLE001
            logger.exception("Seed failed: %s", e)
            db.rollback()
        finally:
            db.close()
    yield
    # Shutdown (nothing to do for MVP)


app = FastAPI(
    title=settings.APP_NAME,
    description="Craftik — Where skills become opportunities. MVP API.",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers under the /api/v1 prefix.
API = settings.API_V1_PREFIX
app.include_router(health_api.router, prefix=API)
app.include_router(auth_api.router, prefix=API)
app.include_router(workers_api.router, prefix=API)
app.include_router(companies_api.router, prefix=API)
app.include_router(jobs_api.router, prefix=API)
app.include_router(applications_api.router, prefix=API)
app.include_router(reviews_api.router, prefix=API)
app.include_router(certifications_api.router, prefix=API)
app.include_router(portfolio_api.router, prefix=API)
app.include_router(portfolio_social_api.router, prefix=API)
app.include_router(messages_api.router, prefix=API)


@app.get("/")
def root():
    return {
        "name": settings.APP_NAME,
        "docs": "/docs",
        "api": API,
        "tagline": "Where skills become opportunities.",
    }
