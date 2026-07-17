"""Worker profile endpoints."""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_worker
from app.db.session import get_db
from app.models.user import User
from app.models.worker import AvailabilityStatus, Profession, WorkerProfile
from app.schemas.worker import WorkerProfilePublic, WorkerProfileUpdate, WorkerSearchResult
from app.services.geo import haversine_km
from app.services.scoring import compute_score, recompute_and_persist

router = APIRouter(prefix="/workers", tags=["workers"])


@router.get("/me", response_model=WorkerProfilePublic)
def get_my_profile(
    current: Annotated[User, Depends(require_worker)],
    db: Annotated[Session, Depends(get_db)],
):
    profile = db.query(WorkerProfile).filter(WorkerProfile.user_id == current.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Worker profile not found")
    return profile


@router.patch("/me", response_model=WorkerProfilePublic)
def update_my_profile(
    payload: WorkerProfileUpdate,
    current: Annotated[User, Depends(require_worker)],
    db: Annotated[Session, Depends(get_db)],
):
    profile = db.query(WorkerProfile).filter(WorkerProfile.user_id == current.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Worker profile not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    db.add(profile)
    db.commit()
    # Recompute score on any profile change (completeness component may change).
    recompute_and_persist(db, profile)
    db.refresh(profile)
    return profile


@router.get("/me/score")
def get_my_score_breakdown(
    current: Annotated[User, Depends(require_worker)],
    db: Annotated[Session, Depends(get_db)],
):
    profile = db.query(WorkerProfile).filter(WorkerProfile.user_id == current.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Worker profile not found")
    breakdown = compute_score(db, profile)
    return {
        "total": breakdown.total,
        "components": [
            {"name": c.name, "value": c.value, "weight": c.weight} for c in breakdown.components
        ],
    }


@router.get("/{worker_id}", response_model=WorkerProfilePublic)
def get_worker(
    worker_id: int,
    _: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    profile = db.get(WorkerProfile, worker_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Worker not found")
    return profile


@router.get("", response_model=list[WorkerSearchResult])
def search_workers(
    _: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    profession: Profession | None = Query(default=None),
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    radius_km: int = Query(25, ge=1, le=500),
    min_score: int = Query(0, ge=0, le=100),
    availability: AvailabilityStatus | None = Query(default=None),
    limit: int = Query(50, ge=1, le=200),
):
    """Search workers within a geographic radius, ranked by match quality.

    Note: Haversine is computed in Python. Fine up to ~50k rows per query; use
    PostGIS + ST_DWithin when we outgrow this.
    """
    q = db.query(WorkerProfile)
    if profession is not None:
        q = q.filter(WorkerProfile.profession == profession)
    if availability is not None:
        q = q.filter(WorkerProfile.availability == availability)
    q = q.filter(WorkerProfile.ai_score >= min_score)

    results: list[WorkerSearchResult] = []
    for w in q.limit(1000).all():
        distance = haversine_km(latitude, longitude, w.latitude, w.longitude)
        if distance > radius_km and not w.willing_to_relocate:
            continue
        # Simple ranking: high score, close, seniority.
        match = min(100, w.ai_score - int(distance) + w.years_experience)
        results.append(
            WorkerSearchResult(
                id=w.id, first_name=w.first_name, last_name=w.last_name, bio=w.bio,
                profession=w.profession, years_experience=w.years_experience, city=w.city,
                latitude=w.latitude, longitude=w.longitude, travel_radius_km=w.travel_radius_km,
                willing_to_relocate=w.willing_to_relocate, hourly_rate_min=w.hourly_rate_min,
                hourly_rate_max=w.hourly_rate_max, availability=w.availability, ai_score=w.ai_score,
                distance_km=distance, match_score=max(0, match),
            )
        )
    results.sort(key=lambda r: r.match_score, reverse=True)
    return results[:limit]
