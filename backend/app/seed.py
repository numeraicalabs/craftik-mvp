"""Idempotent demo seed: 35 complete worker profiles + 15 companies.

Data is generated deterministically from curated lists — every profile gets
bio, certifications, portfolio items (some company-confirmed), and the market
gets jobs, applications (some completed with reviews) and conversations.

Runs only on an empty database. To re-seed production: reset the DB
(Neon: drop/create schema) and redeploy with SEED_ON_STARTUP=true.
"""
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.application import Application, ApplicationStatus, Review
from app.models.certification import Certification, CertificationKind, VerificationStatus
from app.models.company import Company
from app.models.job import JobPost, JobType
from app.models.message import Conversation, Message
from app.models.portfolio import PortfolioItem
from app.models.user import User, UserRole
from app.models.worker import AvailabilityStatus, Profession, WorkerProfile
from app.services.matching import match_score
from app.services.scoring import recompute_and_persist

CITIES = {
    "Milano": (45.4642, 9.1900), "Bergamo": (45.6983, 9.6773), "Brescia": (45.5416, 10.2118),
    "Bologna": (44.4949, 11.3426), "Torino": (45.0703, 7.6869), "Verona": (45.4384, 10.9916),
    "Padova": (45.4064, 11.8768), "Roma": (41.9028, 12.4964), "Firenze": (43.7696, 11.2558),
    "Genova": (44.4056, 8.9463), "Napoli": (40.8518, 14.2681), "Varsavia": (52.2297, 21.0122),
}
CITY_LIST = list(CITIES.keys())

# ---------------- 35 workers ----------------
# (first, last, profession, city, years, rate_min, rate_max, radius, relocate)
WORKERS = [
    ("Marco", "Bianchi", Profession.ELETTRICISTA, "Bergamo", 12, 30, 42, 30, False),
    ("Sara", "Romano", Profession.ELETTRICISTA, "Milano", 8, 32, 45, 25, False),
    ("Luca", "Conti", Profession.IDRAULICO, "Milano", 6, 28, 38, 25, False),
    ("Adam", "Kowalski", Profession.GRUISTA, "Varsavia", 15, 35, 48, 200, True),
    ("Giulia", "Ferri", Profession.IDRAULICO, "Bologna", 4, 25, 34, 30, False),
    ("Paolo", "Verdi", Profession.MURATORE, "Milano", 20, 25, 35, 20, False),
    ("Anna", "Ricci", Profession.CARPENTIERE, "Torino", 9, 28, 40, 40, False),
    ("Yusuf", "Aydin", Profession.SALDATORE, "Brescia", 11, 30, 42, 35, False),
    ("Davide", "Moretti", Profession.PIASTRELLISTA, "Verona", 14, 27, 38, 30, False),
    ("Elena", "Greco", Profession.IMBIANCHINO, "Padova", 7, 22, 32, 25, False),
    ("Stefano", "Rinaldi", Profession.TERMOIDRAULICO, "Milano", 16, 32, 46, 35, False),
    ("Chiara", "Gallo", Profession.CARTONGESSISTA, "Bologna", 5, 24, 33, 25, False),
    ("Andrei", "Popescu", Profession.MURATORE, "Torino", 13, 26, 36, 60, True),
    ("Fatima", "El Amrani", Profession.IMBIANCHINO, "Milano", 6, 23, 32, 20, False),
    ("Giorgio", "Barbieri", Profession.OPERATORE_ESCAVATORE, "Brescia", 18, 34, 46, 50, False),
    ("Martina", "Fontana", Profession.FALEGNAME, "Firenze", 10, 28, 40, 30, False),
    ("Ivan", "Petrov", Profession.SALDATORE, "Genova", 9, 29, 41, 45, True),
    ("Alessia", "Marini", Profession.ELETTRICISTA, "Roma", 11, 30, 43, 30, False),
    ("Omar", "Ben Salah", Profession.CARPENTIERE, "Napoli", 8, 25, 36, 35, False),
    ("Piotr", "Nowak", Profession.CARPENTIERE, "Varsavia", 12, 27, 39, 150, True),
    ("Laura", "Costa", Profession.PIASTRELLISTA, "Genova", 6, 25, 35, 25, False),
    ("Nicola", "De Luca", Profession.IDRAULICO, "Roma", 15, 30, 42, 30, False),
    ("Serena", "Battaglia", Profession.TERMOIDRAULICO, "Napoli", 7, 27, 38, 25, False),
    ("Mattia", "Sartori", Profession.GRUISTA, "Verona", 10, 33, 45, 60, False),
    ("Greta", "Villa", Profession.CARTONGESSISTA, "Milano", 4, 23, 32, 20, False),
    ("Ahmed", "Hassan", Profession.MURATORE, "Bologna", 9, 24, 34, 30, False),
    ("Katarzyna", "Wisniewska", Profession.IMBIANCHINO, "Varsavia", 8, 21, 30, 100, True),
    ("Roberto", "Ferraro", Profession.ELETTRICISTA, "Firenze", 22, 33, 48, 35, False),
    ("Ilaria", "Testa", Profession.FALEGNAME, "Torino", 5, 26, 36, 25, False),
    ("Tommaso", "Grassi", Profession.OPERATORE_ESCAVATORE, "Roma", 14, 33, 45, 40, False),
    ("Vera", "Kovac", Profession.PIASTRELLISTA, "Padova", 9, 26, 36, 30, False),
    ("Simone", "Pellegrini", Profession.TERMOIDRAULICO, "Verona", 12, 30, 42, 30, False),
    ("Noemi", "Caruso", Profession.SALDATORE, "Napoli", 6, 27, 38, 30, False),
    ("Dragan", "Ilic", Profession.GRUISTA, "Brescia", 17, 34, 47, 80, True),
    ("Elisa", "Monti", Profession.IDRAULICO, "Bergamo", 10, 28, 39, 25, False),
]

BIOS = {
    Profession.ELETTRICISTA: "Impianti civili e industriali, quadri elettrici, cabine MT/BT e domotica. Preciso sulle certificazioni di conformità.",
    Profession.IDRAULICO: "Impianti idrico-sanitari, bagni completi e reti di scarico per residenziale e commerciale. Interventi puliti e documentati.",
    Profession.MURATORE: "Murature portanti e di tamponamento, intonaci, ristrutturazioni complete. Abituato a lavorare su cronoprogramma.",
    Profession.CARPENTIERE: "Carpenteria in legno e cemento armato: casseforme, solai, coperture. Lettura disegni esecutivi.",
    Profession.PIASTRELLISTA: "Pavimenti e rivestimenti in ceramica, gres di grande formato e mosaico. Cura del dettaglio in bagni e cucine.",
    Profession.FALEGNAME: "Serramenti, arredi su misura e posa porte. Lavoro sia in laboratorio che in cantiere.",
    Profession.IMBIANCHINO: "Tinteggiature interne ed esterne, decorativi e trattamenti antimuffa. Consegne rapide e ambienti protetti.",
    Profession.SALDATORE: "Saldatura TIG/MIG su acciaio e inox, carpenteria metallica e tubazioni. Patentini aggiornati.",
    Profession.GRUISTA: "Gru a torre e autogru in cantieri civili e infrastrutturali. Massima attenzione alle procedure di sicurezza.",
    Profession.TERMOIDRAULICO: "Centrali termiche, pompe di calore, climatizzazione e contabilizzazione. Aggiornato su detrazioni e libretti impianto.",
    Profession.CARTONGESSISTA: "Contropareti, controsoffitti, isolamento acustico e velette luminose. Finitura pronta al pittore.",
    Profession.OPERATORE_ESCAVATORE: "Escavatori cingolati e gommati, scavi di fondazione e movimento terra. Patentino macchine movimento terra.",
}

CERTS = {
    Profession.ELETTRICISTA: [("patentino", "PES/PAV lavori elettrici", "CEI 11-27"), ("certificazione", "Abilitazione DM 37/08 lett. A", "Camera di Commercio")],
    Profession.IDRAULICO: [("certificazione", "Abilitazione DM 37/08 lett. D", "Camera di Commercio"), ("patentino", "Brasatura forte", "Ente formazione")],
    Profession.MURATORE: [("certificazione", "Formazione ponteggi", "Scuola Edile"), ("patentino", "Preposto sicurezza", "Ente bilaterale")],
    Profession.CARPENTIERE: [("patentino", "Montaggio ponteggi PIMUS", "Scuola Edile"), ("certificazione", "Lavori in quota", "Ente formazione")],
    Profession.PIASTRELLISTA: [("certificazione", "Posatore qualificato Q1", "Assoposa")],
    Profession.FALEGNAME: [("certificazione", "Posatore serramenti EQF3", "Ente formazione")],
    Profession.IMBIANCHINO: [("certificazione", "Lavori in quota", "Ente formazione")],
    Profession.SALDATORE: [("patentino", "Saldatura TIG UNI EN ISO 9606-1", "Istituto Italiano Saldatura"), ("patentino", "Saldatura MIG/MAG", "IIS")],
    Profession.GRUISTA: [("patentino", "Gru a torre", "Accordo Stato-Regioni"), ("patentino", "Autogru", "Accordo Stato-Regioni")],
    Profession.TERMOIDRAULICO: [("patentino", "F-GAS cat. I", "Camera di Commercio"), ("certificazione", "Abilitazione DM 37/08 lett. C", "CCIAA")],
    Profession.CARTONGESSISTA: [("certificazione", "Sistemi a secco avanzati", "Ente formazione")],
    Profession.OPERATORE_ESCAVATORE: [("patentino", "Escavatori idraulici", "Accordo Stato-Regioni"), ("patentino", "Pale caricatrici", "Accordo Stato-Regioni")],
}

PORTFOLIO_TITLES = {
    Profession.ELETTRICISTA: ["Impianto elettrico villa bifamiliare", "Quadri BT capannone industriale", "Rifacimento impianto uffici", "Domotica appartamento di pregio"],
    Profession.IDRAULICO: ["Bagni completi palazzina 8 unità", "Rete idrica ristorante", "Sostituzione colonne di scarico condominio", "Impianto irrigazione giardino condominiale"],
    Profession.MURATORE: ["Ristrutturazione cascina", "Tamponamenti capannone", "Sopraelevazione villetta", "Recinzioni e opere esterne"],
    Profession.CARPENTIERE: ["Casseforme platee e pilastri", "Copertura in legno lamellare", "Solai in latero-cemento", "Struttura pergolato commerciale"],
    Profession.PIASTRELLISTA: ["Gres 120x120 showroom", "Bagni in mosaico hotel", "Pavimentazione esterna antiscivolo", "Rivestimento cucina ristorante"],
    Profession.FALEGNAME: ["Serramenti legno-alluminio villa", "Arredo su misura negozio", "Porte interne palazzina", "Scala in rovere su misura"],
    Profession.IMBIANCHINO: ["Tinteggiatura uffici 1200 mq", "Facciata condominio con decorativo", "Trattamento antimuffa scuola", "Interni villa con velature"],
    Profession.SALDATORE: ["Carpenteria scala antincendio", "Tubazioni inox caseificio", "Cancellate e parapetti", "Strutture metalliche soppalco"],
    Profession.GRUISTA: ["Gru a torre cantiere residenziale 14 mesi", "Montaggi prefabbricati logistica", "Autogru posa travi ponte", "Cantiere torre uffici"],
    Profession.TERMOIDRAULICO: ["Centrale termica condominio 40 unità", "Pompe di calore villette a schiera", "Climatizzazione open space", "Contabilizzazione calore condominio"],
    Profession.CARTONGESSISTA: ["Controsoffitti uffici direzionali", "Isolamento acustico sala prove", "Pareti divisorie clinica", "Velette e gole luminose showroom"],
    Profession.OPERATORE_ESCAVATORE: ["Scavo fondazioni palazzina", "Movimento terra lottizzazione", "Demolizione controllata capannone", "Sbancamento piscina interrata"],
}

# ---------------- 15 companies ----------------
# (email_slug, name, city, employees, description)
COMPANIES = [
    ("edilcostruzioni", "Edilcostruzioni SpA", "Milano", 120, "General contractor attivo in edilizia civile e logistica in Lombardia."),
    ("gruppocasa", "GruppoCasa Srl", "Bergamo", 45, "Impresa di costruzioni residenziali, dal grezzo alle finiture."),
    ("omegafacility", "Omega Facility Srl", "Bologna", 80, "Facility management e manutenzioni su edifici direzionali e sanitari."),
    ("italscavi", "Italscavi Srl", "Brescia", 35, "Scavi, demolizioni e movimento terra per infrastrutture."),
    ("termoclima", "Termoclima Impianti Srl", "Milano", 28, "Impianti termici e climatizzazione per residenziale e terziario."),
    ("elettrosistemi", "Elettrosistemi SpA", "Torino", 95, "Impianti elettrici industriali, cabine e automazione."),
    ("restaura", "Restaura Srl", "Firenze", 22, "Ristrutturazioni e restauro di edifici storici."),
    ("pontedil", "Pontedil Srl", "Roma", 60, "Costruzioni e manutenzioni stradali, opere pubbliche."),
    ("navalfer", "Navalfer Carpenterie Srl", "Genova", 40, "Carpenteria metallica navale e industriale."),
    ("sudimpianti", "Sud Impianti Srl", "Napoli", 33, "Impiantistica idraulica ed elettrica per il terziario."),
    ("venetacase", "Veneta Case Srl", "Padova", 50, "Costruzione di palazzine residenziali chiavi in mano."),
    ("bmcostruzioni", "B.M. Costruzioni Srl", "Verona", 26, "Ristrutturazioni complete e cappotti termici."),
    ("logisticapark", "LogisticaPark SpA", "Milano", 140, "Sviluppo e manutenzione di hub logistici nel Nord Italia."),
    ("greenbuild", "GreenBuild Srl", "Bologna", 18, "Riqualificazione energetica e superbonus condomini."),
    ("warsawbuild", "WarsawBuild Sp. z o.o.", "Varsavia", 70, "Impresa polacca con cantieri in Polonia e Germania."),
]

# ---------------- jobs (company_idx, title, profession, type, city, smin, smax, urgent, min_years) ----------------
JOBS = [
    (0, "Impianto elettrico cabina MT/BT — hub logistico", Profession.ELETTRICISTA, JobType.FREELANCE, "Milano", 35, 45, True, 5),
    (1, "Quadri elettrici residenziale 24 unità", Profession.ELETTRICISTA, JobType.TEMPORARY, "Bergamo", 30, 40, False, 3),
    (0, "Impianto idraulico complesso residenziale", Profession.IDRAULICO, JobType.FREELANCE, "Milano", 28, 38, False, 3),
    (2, "Manutentore idraulico edifici direzionali", Profession.IDRAULICO, JobType.PERMANENT, "Bologna", 1800, 2400, False, 2),
    (0, "Gruista per cantiere infrastrutturale", Profession.GRUISTA, JobType.FREELANCE, "Milano", 32, 45, True, 5),
    (3, "Operatore escavatore — lottizzazione", Profession.OPERATORE_ESCAVATORE, JobType.TEMPORARY, "Brescia", 30, 42, False, 4),
    (4, "Installatore pompe di calore", Profession.TERMOIDRAULICO, JobType.PERMANENT, "Milano", 2000, 2600, False, 3),
    (5, "Elettricista industriale trasferte Piemonte", Profession.ELETTRICISTA, JobType.PERMANENT, "Torino", 1900, 2500, False, 4),
    (6, "Muratore per restauro palazzo storico", Profession.MURATORE, JobType.TEMPORARY, "Firenze", 26, 34, False, 8),
    (7, "Carpentieri per opere stradali", Profession.CARPENTIERE, JobType.SUBCONTRACT, "Roma", 27, 37, True, 3),
    (8, "Saldatore TIG inox — carpenteria navale", Profession.SALDATORE, JobType.FREELANCE, "Genova", 30, 44, True, 5),
    (9, "Idraulico per centri commerciali", Profession.IDRAULICO, JobType.FREELANCE, "Napoli", 26, 36, False, 3),
    (10, "Cartongessista palazzina nuova costruzione", Profession.CARTONGESSISTA, JobType.TEMPORARY, "Padova", 24, 32, False, 2),
    (11, "Piastrellista bagni e cucine", Profession.PIASTRELLISTA, JobType.FREELANCE, "Verona", 26, 36, False, 4),
    (12, "Elettricista manutenzione hub logistici", Profession.ELETTRICISTA, JobType.PERMANENT, "Milano", 2100, 2700, False, 5),
    (13, "Imbianchino cappotti e finiture", Profession.IMBIANCHINO, JobType.TEMPORARY, "Bologna", 22, 30, False, 2),
    (14, "Carpentieri per cantiere Berlino (vitto+alloggio)", Profession.CARPENTIERE, JobType.SUBCONTRACT, "Varsavia", 28, 40, True, 4),
    (6, "Imbianchino decorativo per interni storici", Profession.IMBIANCHINO, JobType.FREELANCE, "Firenze", 24, 34, False, 5),
    (4, "Termoidraulico centrali condominiali", Profession.TERMOIDRAULICO, JobType.FREELANCE, "Milano", 30, 42, False, 5),
    (1, "Muratori finiture residenziale", Profession.MURATORE, JobType.TEMPORARY, "Bergamo", 24, 32, False, 3),
    (12, "Gruista montaggio scaffalature verticali", Profession.GRUISTA, JobType.TEMPORARY, "Milano", 33, 44, False, 6),
    (8, "Falegname allestimenti navali", Profession.FALEGNAME, JobType.FREELANCE, "Genova", 28, 40, False, 4),
]

_PWD: str | None = None


def _pwd() -> str:
    global _PWD
    if _PWD is None:
        _PWD = hash_password("demo1234")
    return _PWD



import base64 as _base64


def _b64_svg(color: str, label: str) -> str:
    """A tiny SVG 'photo' placeholder encoded as base64 (valid data URL image)."""
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">'
        f'<rect width="400" height="300" fill="{color}"/>'
        f'<text x="200" y="160" font-family="Arial" font-size="34" fill="#ffffff" '
        f'text-anchor="middle" font-weight="bold">{label}</text></svg>'
    )
    return _base64.b64encode(svg.encode()).decode()


def seed(db: Session) -> None:
    if db.query(User).first() is not None:
        return  # already seeded

    now_year = datetime.now(timezone.utc).year

    # ---- companies ----
    companies: list[Company] = []
    for i, (slug, name, city, employees, desc) in enumerate(COMPANIES):
        u = User(email=f"hr@{slug}.dev", password_hash=_pwd(), role=UserRole.COMPANY, is_verified=True)
        db.add(u); db.flush()
        c = Company(
            user_id=u.id, legal_name=name, vat_number=f"IT{10000000000 + i * 7351:011d}",
            city=city, employee_count=employees, description=desc,
        )
        db.add(c); db.flush()
        companies.append(c)

    # ---- workers ----
    workers: list[WorkerProfile] = []
    for i, (first, last, prof, city, years, rmin, rmax, radius, reloc) in enumerate(WORKERS):
        lat, lng = CITIES[city]
        email = "marco@craftik.dev" if i == 0 else f"{first.lower().replace(' ', '')}.{last.lower().replace(' ', '').replace(chr(39), '')}@craftik.dev"
        if i == 1:
            email = "sara@craftik.dev"
        u = User(email=email, password_hash=_pwd(), role=UserRole.WORKER, is_verified=True)
        db.add(u); db.flush()
        availability = [AvailabilityStatus.IMMEDIATE, AvailabilityStatus.WITHIN_WEEK, AvailabilityStatus.WITHIN_MONTH][i % 3]
        w = WorkerProfile(
            user_id=u.id, first_name=first, last_name=last, profession=prof,
            years_experience=years, city=city, latitude=lat, longitude=lng,
            travel_radius_km=radius, willing_to_relocate=reloc,
            hourly_rate_min=rmin, hourly_rate_max=rmax, availability=availability,
            bio=f"{first} {last}, {prof.value.replace('_', ' ')} con {years} anni di esperienza. {BIOS[prof]}",
        )
        db.add(w); db.flush()
        workers.append(w)

        # certifications (1-2 per worker, verified)
        for kind, name, issuer in CERTS[prof][: 1 + (i % 2)]:
            db.add(Certification(
                worker_id=w.id, kind=CertificationKind(kind), name=name, issuer=issuer,
                issued_year=now_year - 1 - (i % 6), expires_year=now_year + 3 + (i % 3),
                verification_status=VerificationStatus.VERIFIED,
            ))

        # portfolio (1-3 items; ~half linked to a company, most of those confirmed)
        titles = PORTFOLIO_TITLES[prof]
        n_items = 1 + (i % 3)
        for j in range(n_items):
            linked = companies[(i + j) % len(companies)] if (i + j) % 2 == 0 else None
            confirmed = linked is not None and (i + j) % 4 != 2
            item_city = linked.city if linked else city
            ilat, ilng = CITIES.get(item_city, (lat, lng))
            db.add(PortfolioItem(
                worker_id=w.id, title=titles[j % len(titles)],
                description=f"Intervento completato come {prof.value.replace('_', ' ')}: {titles[j % len(titles)].lower()}. Lavoro consegnato nei tempi e a regola d'arte.",
                role=prof.value.replace("_", " ").title(),
                client_name=linked.legal_name if linked else "Cliente privato",
                city=item_city, latitude=ilat, longitude=ilng,
                year=now_year - 1 - j, duration_weeks=2 + ((i + j) % 10),
                materials=None,
                company_id=linked.id if linked else None,
                confirmed=confirmed,
                confirmed_at=datetime.now(timezone.utc) if confirmed else None,
            ))

    db.flush()

    # ---- jobs ----
    jobs: list[JobPost] = []
    for company_idx, title, prof, jtype, city, smin, smax, urgent, min_years in JOBS:
        lat, lng = CITIES[city]
        j = JobPost(
            company_id=companies[company_idx].id, title=title,
            description=(
                f"{companies[company_idx].legal_name} cerca: {title.lower()}. "
                f"Richiesti almeno {min_years} anni di esperienza nel ruolo, autonomia operativa "
                "e rispetto delle norme di sicurezza. Possibilità di continuità su cantieri successivi."
            ),
            profession=prof, job_type=jtype, city=city, latitude=lat, longitude=lng,
            salary_min=smin, salary_max=smax, is_urgent=urgent, min_years_experience=min_years,
        )
        db.add(j); db.flush()
        jobs.append(j)

    # ---- applications ----
    # For each job, apply the 1-3 best-matching workers of the same profession.
    status_cycle = [
        ApplicationStatus.COMPLETED, ApplicationStatus.APPLIED, ApplicationStatus.SHORTLISTED,
        ApplicationStatus.APPLIED, ApplicationStatus.INTERVIEW, ApplicationStatus.APPLIED,
        ApplicationStatus.HIRED, ApplicationStatus.SHORTLISTED,
    ]
    applications: list[Application] = []
    s = 0
    for job in jobs:
        candidates = [w for w in workers if w.profession == job.profession][:3]
        for w in candidates:
            status = status_cycle[s % len(status_cycle)]
            s += 1
            a = Application(
                job_id=job.id, worker_id=w.id, status=status,
                cover_message=f"Disponibile per '{job.title}'. Esperienza diretta su lavori analoghi.",
                match_score=match_score(w, job),
            )
            db.add(a); db.flush()
            applications.append(a)

    # ---- reviews on completed engagements ----
    comments = [
        "Lavoro impeccabile, consegnato in anticipo. Da richiamare.",
        "Professionale, puntuale e ordinato in cantiere.",
        "Ottima qualità, comunicazione chiara con la direzione lavori.",
        "Molto preparato, ha risolto anche imprevisti non a capitolato.",
        "Affidabile: lo richiameremo per i prossimi cantieri.",
    ]
    r = 0
    for a in applications:
        if a.status != ApplicationStatus.COMPLETED:
            continue
        job = next(j for j in jobs if j.id == a.job_id)
        company = next(c for c in companies if c.id == job.company_id)
        worker = next(w for w in workers if w.id == a.worker_id)
        rating = 5 if r % 3 != 2 else 4
        db.add(Review(
            application_id=a.id, author_role="company",
            author_user_id=company.user_id, target_user_id=worker.user_id,
            rating=rating, punctuality=rating, quality=rating, communication=max(4, rating - (r % 2)),
            comment=comments[r % len(comments)],
        ))
        r += 1

    # ---- conversations ----
    for i in range(8):
        w = workers[i * 4 % len(workers)]
        c = companies[i % len(companies)]
        conv = Conversation(worker_user_id=w.user_id, company_user_id=c.user_id,
                            last_message_at=datetime.now(timezone.utc))
        db.add(conv); db.flush()
        db.add(Message(conversation_id=conv.id, sender_user_id=c.user_id,
                       body=f"Buongiorno {w.first_name}, abbiamo visto il suo profilo: sarebbe disponibile per un sopralluogo la prossima settimana?"))
        db.add(Message(conversation_id=conv.id, sender_user_id=w.user_id,
                       body="Buongiorno, sì, sono disponibile martedì o mercoledì mattina. Mi può inviare l'indirizzo del cantiere?"))

    db.commit()

    # ---- social layer: proof photos, likes, comments on portfolio items ----
    from app.models.social import PortfolioComment, PortfolioLike, PortfolioPhoto

    # Tiny 4x3 solid-color JPEG data URLs (valid images, ~0.3KB each) as placeholders.
    # In production these are real photos uploaded from the phone.
    SWATCHES = [
        "data:image/svg+xml;base64," + _b64_svg("#0F2A43", "Cantiere"),
        "data:image/svg+xml;base64," + _b64_svg("#FF6B1A", "Prima"),
        "data:image/svg+xml;base64," + _b64_svg("#1DB954", "Dopo"),
        "data:image/svg+xml;base64," + _b64_svg("#16395C", "Dettaglio"),
    ]
    all_items = db.query(PortfolioItem).all()
    all_company_users = [c.user_id for c in companies]
    comment_pool = [
        "Ottimo lavoro, pulito e a regola d'arte.",
        "Complimenti, si vede la cura del dettaglio.",
        "Bel cantiere! Ci piacerebbe lavorare con te.",
        "Finiture impeccabili.",
        "Che bel risultato, bravo davvero.",
    ]
    for idx, it in enumerate(all_items):
        # 1-3 proof photos on ~70% of items
        if idx % 10 < 7:
            n_photos = 1 + (idx % 3)
            for k in range(n_photos):
                db.add(PortfolioPhoto(
                    portfolio_item_id=it.id,
                    data_url=SWATCHES[(idx + k) % len(SWATCHES)],
                    caption=["Vista generale", "Fase di lavorazione", "Risultato finale", "Particolare"][k % 4],
                    position=k,
                ))
        # likes from a few companies
        for j in range((idx % 4)):
            db.add(PortfolioLike(portfolio_item_id=it.id, user_id=all_company_users[(idx + j) % len(all_company_users)]))
        # a comment on ~40% of items
        if idx % 5 < 2:
            db.add(PortfolioComment(
                portfolio_item_id=it.id,
                user_id=all_company_users[idx % len(all_company_users)],
                body=comment_pool[idx % len(comment_pool)],
            ))
    db.commit()

    # ---- final: compute all scores ----
    for w in db.query(WorkerProfile).all():
        recompute_and_persist(db, w)

    print(f"[seed] {len(workers)} workers, {len(companies)} companies, {len(jobs)} jobs, "
          f"{len(applications)} applications loaded at {datetime.now(timezone.utc).isoformat()}")
