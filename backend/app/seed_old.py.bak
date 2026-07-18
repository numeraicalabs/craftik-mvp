"""Idempotent demo seed loader.

Run at startup when SEED_ON_STARTUP=true and DB is empty. Safe to run again.
"""
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.application import Application, ApplicationStatus, Review
from app.models.company import Company
from app.models.job import JobPost, JobStatus, JobType
from app.models.user import User, UserRole
from app.models.worker import AvailabilityStatus, Profession, WorkerProfile
from app.services.scoring import recompute_and_persist

# City → (lat, lng)
CITIES = {
    "Milano": (45.4642, 9.1900),
    "Bergamo": (45.6983, 9.6773),
    "Brescia": (45.5416, 10.2118),
    "Bologna": (44.4949, 11.3426),
    "Torino": (45.0703, 7.6869),
    "Verona": (45.4384, 10.9916),
    "Padova": (45.4064, 11.8768),
    "Varsavia": (52.2297, 21.0122),
}

DEMO_PWD_HASH = None  # cached hash to avoid recomputing bcrypt per user


def _pwd() -> str:
    global DEMO_PWD_HASH
    if DEMO_PWD_HASH is None:
        DEMO_PWD_HASH = hash_password("demo1234")
    return DEMO_PWD_HASH


def _mk_worker(db: Session, email: str, first: str, last: str, profession: Profession,
               city: str, years: int, rate_min: int, rate_max: int, radius: int = 30,
               verified: bool = True) -> WorkerProfile:
    lat, lng = CITIES[city]
    u = User(email=email, password_hash=_pwd(), role=UserRole.WORKER, is_verified=verified)
    db.add(u); db.flush()
    p = WorkerProfile(
        user_id=u.id, first_name=first, last_name=last,
        profession=profession, years_experience=years,
        city=city, latitude=lat, longitude=lng, travel_radius_km=radius,
        hourly_rate_min=rate_min, hourly_rate_max=rate_max,
        availability=AvailabilityStatus.WITHIN_WEEK,
        bio=f"{first} è un/a {profession.value} con {years} anni di esperienza a {city}. "
            f"Lavora principalmente su cantieri residenziali e commerciali.",
    )
    db.add(p); db.flush()
    return p


def _mk_company(db: Session, email: str, name: str, vat: str, city: str, employees: int) -> Company:
    u = User(email=email, password_hash=_pwd(), role=UserRole.COMPANY, is_verified=True)
    db.add(u); db.flush()
    c = Company(
        user_id=u.id, legal_name=name, vat_number=vat, city=city, employee_count=employees,
        description=f"{name}, impresa attiva a {city} nel settore delle costruzioni e manutenzioni.",
    )
    db.add(c); db.flush()
    return c


def _mk_job(db: Session, company: Company, title: str, description: str, profession: Profession,
            job_type: JobType, city: str, sal_min: int, sal_max: int,
            urgent: bool = False, min_years: int = 0) -> JobPost:
    lat, lng = CITIES[city]
    j = JobPost(
        company_id=company.id, title=title, description=description,
        profession=profession, job_type=job_type,
        city=city, latitude=lat, longitude=lng,
        salary_min=sal_min, salary_max=sal_max,
        is_urgent=urgent, min_years_experience=min_years,
    )
    db.add(j); db.flush()
    return j


def seed(db: Session) -> None:
    if db.query(User).first() is not None:
        return  # already seeded

    # --- Workers ---
    marco = _mk_worker(db, "marco@craftik.dev", "Marco", "Bianchi", Profession.ELETTRICISTA,
                       "Bergamo", years=12, rate_min=30, rate_max=42)
    sara = _mk_worker(db, "sara@craftik.dev", "Sara", "Romano", Profession.ELETTRICISTA,
                      "Milano", years=8, rate_min=32, rate_max=45)
    luca = _mk_worker(db, "luca@craftik.dev", "Luca", "Conti", Profession.IDRAULICO,
                      "Milano", years=6, rate_min=28, rate_max=38)
    adam = _mk_worker(db, "adam@craftik.dev", "Adam", "Kowalski", Profession.GRUISTA,
                      "Varsavia", years=15, rate_min=35, rate_max=48, radius=200)
    adam.willing_to_relocate = True
    db.add(adam)
    giulia = _mk_worker(db, "giulia@craftik.dev", "Giulia", "Ferri", Profession.IDRAULICO,
                        "Bologna", years=4, rate_min=25, rate_max=34)
    paolo = _mk_worker(db, "paolo@craftik.dev", "Paolo", "Verdi", Profession.MURATORE,
                       "Milano", years=20, rate_min=25, rate_max=35)
    anna = _mk_worker(db, "anna@craftik.dev", "Anna", "Ricci", Profession.CARPENTIERE,
                      "Torino", years=9, rate_min=28, rate_max=40)
    yusuf = _mk_worker(db, "yusuf@craftik.dev", "Yusuf", "Aydin", Profession.SALDATORE,
                      "Brescia", years=11, rate_min=30, rate_max=42)

    # --- Companies ---
    edil = _mk_company(db, "hr@edilcostruzioni.dev", "Edilcostruzioni SpA",
                       "IT01234567890", "Milano", employees=120)
    gruppo = _mk_company(db, "hr@gruppocasa.dev", "GruppoCasa Srl",
                        "IT09876543210", "Bergamo", employees=45)
    facility = _mk_company(db, "hr@omegafacility.dev", "Omega Facility Srl",
                          "IT05555555555", "Bologna", employees=80)

    # --- Jobs ---
    j1 = _mk_job(db, edil, "Impianto elettrico cabina MT/BT — hub logistico",
                 "Cerchiamo un elettricista senior per impianto elettrico cabina di trasformazione MT/BT "
                 "in un nuovo hub logistico a Milano Lambrate. Cantiere 6 settimane, possibile continuità.",
                 Profession.ELETTRICISTA, JobType.FREELANCE, "Milano",
                 sal_min=35, sal_max=45, urgent=True, min_years=5)
    j2 = _mk_job(db, gruppo, "Quadri elettrici residenziale 24 unità",
                 "Realizzazione quadri elettrici e collegamenti per complesso residenziale a Bergamo. "
                 "4 settimane, ottima organizzazione richiesta.",
                 Profession.ELETTRICISTA, JobType.TEMPORARY, "Bergamo",
                 sal_min=30, sal_max=40, min_years=3)
    j3 = _mk_job(db, edil, "Impianto idraulico complesso residenziale",
                 "Impianto idrico-sanitario per 12 unità abitative. Materiali forniti dall'azienda.",
                 Profession.IDRAULICO, JobType.FREELANCE, "Milano",
                 sal_min=28, sal_max=38, min_years=3)
    j4 = _mk_job(db, facility, "Manutenzione ordinaria impianti sanitari",
                 "Contratto di manutenzione ordinaria e straordinaria su edifici direzionali. "
                 "Assunzione a tempo indeterminato.",
                 Profession.IDRAULICO, JobType.PERMANENT, "Bologna",
                 sal_min=1800, sal_max=2400, min_years=2)
    j5 = _mk_job(db, edil, "Gruista per cantiere infrastrutturale",
                 "Cercasi gruista con patentino aggiornato per gru a torre. Cantiere di 3 mesi, "
                 "disponibilità a trasferte gradita.",
                 Profession.GRUISTA, JobType.FREELANCE, "Milano",
                 sal_min=32, sal_max=45, urgent=True, min_years=5)

    # --- Applications & completed engagement + review ---
    # Marco (elettricista senior) applies to j1 (elettricista urgent) → hired → completed with 5-star review
    from app.services.matching import match_score
    app1 = Application(
        job_id=j1.id, worker_id=marco.id, cover_message="Ho realizzato 3 cabine MT/BT simili negli ultimi 2 anni.",
        match_score=match_score(marco, j1), status=ApplicationStatus.COMPLETED,
    )
    db.add(app1); db.flush()

    review1 = Review(
        application_id=app1.id, author_role="company",
        author_user_id=edil.user_id, target_user_id=marco.user_id,
        rating=5, punctuality=5, quality=5, communication=4,
        comment="Lavoro impeccabile, consegnato in anticipo. Assolutamente da richiamare.",
    )
    db.add(review1)

    # Sara applies to j2 → shortlisted
    app2 = Application(
        job_id=j2.id, worker_id=sara.id, cover_message="Disponibile da subito.",
        match_score=match_score(sara, j2), status=ApplicationStatus.SHORTLISTED,
    )
    db.add(app2)

    # Luca applies to j3 → applied
    app3 = Application(
        job_id=j3.id, worker_id=luca.id, match_score=match_score(luca, j3),
        status=ApplicationStatus.APPLIED,
    )
    db.add(app3)

    # Giulia applies to j4 → interview
    app4 = Application(
        job_id=j4.id, worker_id=giulia.id, match_score=match_score(giulia, j4),
        status=ApplicationStatus.INTERVIEW,
    )
    db.add(app4)

    # Adam applies to j5 (crane operator) → shortlisted
    app5 = Application(
        job_id=j5.id, worker_id=adam.id,
        cover_message="Patentino gru a torre + esperienza cantieri infrastrutturali.",
        match_score=match_score(adam, j5), status=ApplicationStatus.SHORTLISTED,
    )
    db.add(app5)

    db.commit()

    # Recompute scores for all workers.
    for w in db.query(WorkerProfile).all():
        recompute_and_persist(db, w)

    print(f"[seed] loaded at {datetime.now(timezone.utc).isoformat()}")
