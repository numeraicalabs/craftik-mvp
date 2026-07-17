"""Reputational score service (v0 — rule-based, explainable).

Score components (weighted, 0-100 each, aggregated to 0-100 final):
- verified_identity      15%
- profile_completeness   15%
- experience             15%
- reviews_rating         30%
- completed_jobs         25%

In v1 we'll replace this with a trained model on ~10k engagements.
The interface (compute + explain) stays the same, so callers don't change.
"""
from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.models.application import Application, ApplicationStatus, Review
from app.models.worker import WorkerProfile


@dataclass
class ScoreComponent:
    name: str
    value: int  # 0-100
    weight: float  # 0-1


@dataclass
class ScoreBreakdown:
    total: int
    components: list[ScoreComponent]


def _experience_score(years: int) -> int:
    # Diminishing returns: 0y=0, 3y=50, 10y=90, 20y+=100
    if years <= 0:
        return 0
    return min(100, int(100 * (1 - 0.85 ** years)))


def _completeness_score(worker: WorkerProfile) -> int:
    filled = 0
    total = 6
    if worker.bio and len(worker.bio) > 30:
        filled += 1
    if worker.years_experience > 0:
        filled += 1
    if worker.hourly_rate_min > 0 and worker.hourly_rate_max > worker.hourly_rate_min:
        filled += 1
    if worker.travel_radius_km:
        filled += 1
    if worker.city:
        filled += 1
    if worker.latitude and worker.longitude:
        filled += 1
    return int(100 * filled / total)


def compute_score(db: Session, worker: WorkerProfile) -> ScoreBreakdown:
    # Reviews aggregate
    reviews = (
        db.query(Review)
        .join(Application, Application.id == Review.application_id)
        .filter(Application.worker_id == worker.id, Review.author_role == "company")
        .all()
    )
    if reviews:
        avg_rating = sum(r.rating for r in reviews) / len(reviews)
        reviews_score = int((avg_rating / 5) * 100)
    else:
        reviews_score = 40  # neutral prior — a worker without reviews isn't 0

    # Completed engagements
    completed_count = (
        db.query(Application)
        .filter(
            Application.worker_id == worker.id,
            Application.status == ApplicationStatus.COMPLETED,
        )
        .count()
    )
    # 0 completed → 20, saturates around 30 jobs
    completed_score = min(100, 20 + completed_count * 3)

    identity_score = 100 if worker.user and worker.user.is_verified else 20

    components = [
        ScoreComponent("Identità verificata", identity_score, 0.15),
        ScoreComponent("Completezza profilo", _completeness_score(worker), 0.15),
        ScoreComponent("Esperienza", _experience_score(worker.years_experience), 0.15),
        ScoreComponent("Recensioni", reviews_score, 0.30),
        ScoreComponent("Lavori completati", completed_score, 0.25),
    ]
    total = round(sum(c.value * c.weight for c in components))
    return ScoreBreakdown(total=total, components=components)


def recompute_and_persist(db: Session, worker: WorkerProfile) -> ScoreBreakdown:
    breakdown = compute_score(db, worker)
    worker.ai_score = breakdown.total
    db.add(worker)
    db.commit()
    db.refresh(worker)
    return breakdown
