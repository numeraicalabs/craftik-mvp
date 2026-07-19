"""Social layer endpoints on portfolio items: photos, likes, comments.

Mounted under the same /portfolio prefix as the base router but kept in its
own module so the base CRUD stays readable.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_worker
from app.db.session import get_db
from app.models.company import Company
from app.models.portfolio import PortfolioItem
from app.models.social import PortfolioComment, PortfolioLike, PortfolioPhoto
from app.models.user import User, UserRole
from app.models.worker import WorkerProfile
from app.schemas.social import (
    CommentCreate,
    CommentPublic,
    PhotoCreate,
    PhotoPublic,
    PortfolioItemFull,
)

router = APIRouter(prefix="/portfolio", tags=["portfolio-social"])


def _display_name(db: Session, user: User) -> tuple[str, str]:
    if user.role == UserRole.WORKER:
        w = db.query(WorkerProfile).filter(WorkerProfile.user_id == user.id).first()
        return (f"{w.first_name} {w.last_name}" if w else "Professionista", "worker")
    c = db.query(Company).filter(Company.user_id == user.id).first()
    return (c.legal_name if c else "Azienda", "company")


def _my_item(db: Session, user: User, item_id: int) -> PortfolioItem:
    item = db.get(PortfolioItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    worker = db.query(WorkerProfile).filter(WorkerProfile.user_id == user.id).first()
    if not worker or item.worker_id != worker.id:
        raise HTTPException(status_code=403, detail="Not your portfolio item")
    return item


# ---------- Enriched list (photos + social counters) ----------
@router.get("/workers/{worker_id}/full", response_model=list[PortfolioItemFull])
def list_full(
    worker_id: int,
    current: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    items = (
        db.query(PortfolioItem)
        .filter(PortfolioItem.worker_id == worker_id)
        .order_by(PortfolioItem.year.desc().nullslast(), PortfolioItem.id.desc())
        .all()
    )
    out: list[PortfolioItemFull] = []
    for it in items:
        photos = (
            db.query(PortfolioPhoto)
            .filter(PortfolioPhoto.portfolio_item_id == it.id)
            .order_by(PortfolioPhoto.position, PortfolioPhoto.id)
            .all()
        )
        like_count = db.query(func.count(PortfolioLike.id)).filter(
            PortfolioLike.portfolio_item_id == it.id
        ).scalar() or 0
        liked_by_me = db.query(PortfolioLike).filter(
            PortfolioLike.portfolio_item_id == it.id, PortfolioLike.user_id == current.id
        ).first() is not None
        comment_count = db.query(func.count(PortfolioComment.id)).filter(
            PortfolioComment.portfolio_item_id == it.id
        ).scalar() or 0

        out.append(PortfolioItemFull(
            id=it.id, worker_id=it.worker_id, title=it.title, description=it.description,
            role=it.role, client_name=it.client_name, city=it.city, year=it.year,
            duration_weeks=it.duration_weeks, materials=it.materials, company_id=it.company_id,
            confirmed=it.confirmed, confirmed_at=it.confirmed_at,
            photos=[PhotoPublic.model_validate(p) for p in photos],
            like_count=like_count, liked_by_me=liked_by_me, comment_count=comment_count,
        ))
    return out


# ---------- Photos ----------
@router.post("/me/{item_id}/photos", response_model=PhotoPublic, status_code=201)
def add_photo(
    item_id: int,
    payload: PhotoCreate,
    current: Annotated[User, Depends(require_worker)],
    db: Annotated[Session, Depends(get_db)],
):
    item = _my_item(db, current, item_id)
    if not payload.data_url.startswith("data:image/"):
        raise HTTPException(status_code=422, detail="data_url must be an image data URL")
    count = db.query(func.count(PortfolioPhoto.id)).filter(
        PortfolioPhoto.portfolio_item_id == item.id
    ).scalar() or 0
    if count >= 8:
        raise HTTPException(status_code=400, detail="Massimo 8 foto per lavoro")
    photo = PortfolioPhoto(
        portfolio_item_id=item.id, data_url=payload.data_url,
        caption=payload.caption, position=count,
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return photo


@router.delete("/me/photos/{photo_id}", status_code=204)
def delete_photo(
    photo_id: int,
    current: Annotated[User, Depends(require_worker)],
    db: Annotated[Session, Depends(get_db)],
):
    photo = db.get(PortfolioPhoto, photo_id)
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    _my_item(db, current, photo.portfolio_item_id)  # ownership check
    db.delete(photo)
    db.commit()


# ---------- Likes ----------
@router.post("/{item_id}/like")
def toggle_like(
    item_id: int,
    current: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    if db.get(PortfolioItem, item_id) is None:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    existing = db.query(PortfolioLike).filter(
        PortfolioLike.portfolio_item_id == item_id, PortfolioLike.user_id == current.id
    ).first()
    if existing:
        db.delete(existing)
        db.commit()
        liked = False
    else:
        db.add(PortfolioLike(portfolio_item_id=item_id, user_id=current.id))
        db.commit()
        liked = True
    count = db.query(func.count(PortfolioLike.id)).filter(
        PortfolioLike.portfolio_item_id == item_id
    ).scalar() or 0
    return {"liked": liked, "like_count": count}


# ---------- Comments ----------
@router.get("/{item_id}/comments", response_model=list[CommentPublic])
def list_comments(
    item_id: int,
    _: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    comments = (
        db.query(PortfolioComment)
        .filter(PortfolioComment.portfolio_item_id == item_id)
        .order_by(PortfolioComment.created_at)
        .all()
    )
    out: list[CommentPublic] = []
    for c in comments:
        u = db.get(User, c.user_id)
        name, role = _display_name(db, u) if u else ("Utente", "unknown")
        out.append(CommentPublic(
            id=c.id, user_id=c.user_id, author_name=name, author_role=role,
            body=c.body, created_at=c.created_at,
        ))
    return out


@router.post("/{item_id}/comments", response_model=CommentPublic, status_code=201)
def add_comment(
    item_id: int,
    payload: CommentCreate,
    current: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    if db.get(PortfolioItem, item_id) is None:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    comment = PortfolioComment(portfolio_item_id=item_id, user_id=current.id, body=payload.body)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    name, role = _display_name(db, current)
    return CommentPublic(
        id=comment.id, user_id=current.id, author_name=name, author_role=role,
        body=comment.body, created_at=comment.created_at,
    )


@router.delete("/comments/{comment_id}", status_code=204)
def delete_comment(
    comment_id: int,
    current: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    comment = db.get(PortfolioComment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current.id:
        raise HTTPException(status_code=403, detail="Not your comment")
    db.delete(comment)
    db.commit()
