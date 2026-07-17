"""Worker↔Job match score (0-100), explainable.

This is the seed of what becomes the two-tower model in v2.
For MVP we compose a few obvious features into a single score.

Features:
- profession match (hard filter usually, weight 30 if same)
- distance vs travel_radius (0 if outside, up to 25 if within)
- experience meets requirement (up to 20)
- reputation score (up to 25 = worker.ai_score/4)
"""
from app.models.job import JobPost
from app.models.worker import WorkerProfile
from app.services.geo import haversine_km


def match_score(worker: WorkerProfile, job: JobPost) -> int:
    score = 0

    # 1. Profession match (30)
    if worker.profession == job.profession:
        score += 30

    # 2. Distance (25). Trip-friendly workers (willing_to_relocate) get full points regardless.
    distance = haversine_km(worker.latitude, worker.longitude, job.latitude, job.longitude)
    if worker.willing_to_relocate:
        score += 25
    elif distance <= worker.travel_radius_km:
        # linear decay inside the radius: closer is better
        score += int(25 * (1 - distance / max(worker.travel_radius_km, 1)))

    # 3. Experience (20)
    if worker.years_experience >= job.min_years_experience:
        margin = worker.years_experience - job.min_years_experience
        score += min(20, 10 + margin * 2)

    # 4. Reputation (25)
    score += int(worker.ai_score / 4)

    return max(0, min(100, score))
