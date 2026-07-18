"""Badge engine: badges are COMPUTED from verified stats, never stored.

This keeps them impossible to fake and always up to date. If a badge needs
history later (e.g. 'earned on date X'), snapshot into a user_badges table.
"""
from sqlalchemy.orm import Session

from app.models.application import Application, ApplicationStatus, Review
from app.models.certification import Certification, VerificationStatus
from app.models.portfolio import PortfolioItem
from app.models.worker import WorkerProfile

PROFESSION_LABEL = {
    "elettricista": "Elettricista", "idraulico": "Idraulico", "muratore": "Muratore",
    "carpentiere": "Carpentiere", "piastrellista": "Piastrellista", "falegname": "Falegname",
    "imbianchino": "Imbianchino", "saldatore": "Saldatore", "gruista": "Gruista",
    "termoidraulico": "Termoidraulico", "cartongessista": "Cartongessista",
    "operatore_escavatore": "Operatore escavatore",
}


def compute_badges(db: Session, worker: WorkerProfile) -> list[dict]:
    badges: list[dict] = []

    if worker.user and worker.user.is_verified:
        badges.append({
            "code": "verified", "label": "Profilo Verificato", "icon": "✓",
            "description": "Identità verificata con documento.",
        })

    completed = (
        db.query(Application)
        .filter(Application.worker_id == worker.id, Application.status == ApplicationStatus.COMPLETED)
        .count()
    )
    confirmed_works = (
        db.query(PortfolioItem)
        .filter(PortfolioItem.worker_id == worker.id, PortfolioItem.confirmed.is_(True))
        .count()
    )
    total_works = completed + confirmed_works
    for threshold, code in ((100, "cantieri_100"), (50, "cantieri_50"), (10, "cantieri_10")):
        if total_works >= threshold:
            badges.append({
                "code": code, "label": f"{threshold} Cantieri", "icon": "🏗️",
                "description": f"Almeno {threshold} lavori verificati sulla piattaforma.",
            })
            break

    if worker.ai_score >= 85:
        label = PROFESSION_LABEL.get(worker.profession.value, worker.profession.value.title())
        badges.append({
            "code": "top_pro", "label": f"Top {label}", "icon": "⚡",
            "description": "Score nel top della categoria (85+).",
        })

    reviews = (
        db.query(Review)
        .join(Application, Application.id == Review.application_id)
        .filter(Application.worker_id == worker.id, Review.author_role == "company")
        .all()
    )
    if len(reviews) >= 3 and sum(r.rating for r in reviews) / len(reviews) >= 4.8:
        badges.append({
            "code": "five_stars", "label": "Cliente Preferito", "icon": "⭐",
            "description": "Media recensioni 4.8+ su almeno 3 ingaggi.",
        })

    verified_certs = (
        db.query(Certification)
        .filter(
            Certification.worker_id == worker.id,
            Certification.verification_status == VerificationStatus.VERIFIED,
        )
        .count()
    )
    if verified_certs >= 2:
        badges.append({
            "code": "certified", "label": "Certificato", "icon": "📜",
            "description": "Almeno 2 certificazioni o patentini verificati.",
        })

    if worker.years_experience >= 15:
        badges.append({
            "code": "veteran", "label": "Veterano", "icon": "🛠️",
            "description": "15+ anni di esperienza sul campo.",
        })

    if worker.willing_to_relocate:
        badges.append({
            "code": "traveler", "label": "Trasfertista", "icon": "🚐",
            "description": "Disponibile a trasferte in tutta Europa.",
        })

    return badges
