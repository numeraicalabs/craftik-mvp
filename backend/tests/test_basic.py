"""Basic tests: verify pure services and API smoke tests with an in-memory DB."""
import os
os.environ["DATABASE_URL"] = "sqlite:///./test_craftik.db"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.session import Base, get_db
from app.main import app
from app.services.geo import haversine_km
from app.services.matching import match_score
from app.models.worker import WorkerProfile, Profession, AvailabilityStatus
from app.models.job import JobPost, JobType, JobStatus


# --- Pure service tests ---

def test_haversine_known_pair():
    # Milano to Bergamo is roughly 40-50 km straight line
    d = haversine_km(45.4642, 9.1900, 45.6983, 9.6773)
    assert 40 <= d <= 55


def test_match_score_perfect():
    w = WorkerProfile(
        id=1, user_id=1, first_name="M", last_name="B",
        profession=Profession.ELETTRICISTA, years_experience=10,
        city="Milano", latitude=45.4642, longitude=9.1900, travel_radius_km=50,
        willing_to_relocate=False, hourly_rate_min=30, hourly_rate_max=45,
        availability=AvailabilityStatus.IMMEDIATE, ai_score=90,
    )
    j = JobPost(
        id=1, company_id=1, title="t", description="d",
        profession=Profession.ELETTRICISTA, job_type=JobType.FREELANCE,
        city="Milano", latitude=45.4642, longitude=9.1900,
        salary_min=30, salary_max=45, is_urgent=False, min_years_experience=3,
        status=JobStatus.OPEN,
    )
    score = match_score(w, j)
    assert score >= 90  # same city, same profession, senior, high rep


def test_match_score_out_of_radius():
    w = WorkerProfile(
        id=1, user_id=1, first_name="M", last_name="B",
        profession=Profession.ELETTRICISTA, years_experience=5,
        city="Milano", latitude=45.4642, longitude=9.1900, travel_radius_km=10,
        willing_to_relocate=False, hourly_rate_min=30, hourly_rate_max=45,
        availability=AvailabilityStatus.IMMEDIATE, ai_score=70,
    )
    j = JobPost(
        id=1, company_id=1, title="t", description="d",
        profession=Profession.ELETTRICISTA, job_type=JobType.FREELANCE,
        city="Roma", latitude=41.9028, longitude=12.4964,
        salary_min=30, salary_max=45, is_urgent=False, min_years_experience=3,
        status=JobStatus.OPEN,
    )
    # Milano-Roma ~475 km, worker won't travel → no distance points
    score = match_score(w, j)
    assert score < 80  # profession + reputation + experience only


# --- API smoke test with test client ---

@pytest.fixture(scope="module")
def client():
    # Use a fresh SQLite file for the test suite
    test_url = "sqlite:///./test_craftik.db"
    test_engine = create_engine(test_url, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

    Base.metadata.create_all(bind=test_engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("test_craftik.db"):
        os.remove("test_craftik.db")


def test_health_endpoint(client):
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_worker_registration_and_login(client):
    # Register
    r = client.post("/api/v1/auth/register/worker", json={
        "email": "test@craftik.dev", "password": "verysecure1",
        "first_name": "Test", "last_name": "User",
        "profession": "elettricista",
        "city": "Milano", "latitude": 45.4642, "longitude": 9.19,
        "years_experience": 5, "travel_radius_km": 30,
    })
    assert r.status_code == 201, r.text
    token = r.json()["access_token"]
    # Access /me
    r = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["role"] == "worker"
