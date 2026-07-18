"""Messaging endpoints. REST + polling for MVP (free-tier friendly);
the model layer is ready for a WebSocket transport later.
"""
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.company import Company
from app.models.message import Conversation, Message
from app.models.user import User, UserRole
from app.models.worker import WorkerProfile
from app.schemas.extras import ConversationCreate, ConversationPublic, MessageCreate, MessagePublic

router = APIRouter(prefix="/messages", tags=["messages"])


def _display_name(db: Session, user: User) -> str:
    if user.role == UserRole.WORKER:
        w = db.query(WorkerProfile).filter(WorkerProfile.user_id == user.id).first()
        return f"{w.first_name} {w.last_name}" if w else user.email
    c = db.query(Company).filter(Company.user_id == user.id).first()
    return c.legal_name if c else user.email


def _conversation_for(db: Session, conv_id: int, user: User) -> Conversation:
    conv = db.get(Conversation, conv_id)
    if not conv or user.id not in (conv.worker_user_id, conv.company_user_id):
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


@router.get("/conversations", response_model=list[ConversationPublic])
def list_conversations(
    current: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    convs = (
        db.query(Conversation)
        .filter(or_(Conversation.worker_user_id == current.id, Conversation.company_user_id == current.id))
        .order_by(Conversation.last_message_at.desc().nullslast())
        .all()
    )
    out: list[ConversationPublic] = []
    for c in convs:
        other_id = c.company_user_id if c.worker_user_id == current.id else c.worker_user_id
        other = db.get(User, other_id)
        last = (
            db.query(Message)
            .filter(Message.conversation_id == c.id)
            .order_by(Message.created_at.desc())
            .first()
        )
        out.append(ConversationPublic(
            id=c.id,
            other_user_id=other_id,
            other_name=_display_name(db, other) if other else "Utente",
            other_role=other.role.value if other else "unknown",
            last_message_preview=(last.body[:80] if last else None),
            last_message_at=c.last_message_at,
        ))
    return out


@router.post("/conversations", response_model=ConversationPublic, status_code=201)
def open_conversation(
    payload: ConversationCreate,
    current: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    other = db.get(User, payload.other_user_id)
    if not other or other.id == current.id:
        raise HTTPException(status_code=404, detail="User not found")
    if other.role == current.role:
        raise HTTPException(status_code=400, detail="Conversations connect a worker and a company")

    worker_uid = current.id if current.role == UserRole.WORKER else other.id
    company_uid = current.id if current.role == UserRole.COMPANY else other.id

    conv = (
        db.query(Conversation)
        .filter(Conversation.worker_user_id == worker_uid, Conversation.company_user_id == company_uid)
        .first()
    )
    if not conv:
        conv = Conversation(worker_user_id=worker_uid, company_user_id=company_uid)
        db.add(conv)
        db.commit()
        db.refresh(conv)

    return ConversationPublic(
        id=conv.id,
        other_user_id=other.id,
        other_name=_display_name(db, other),
        other_role=other.role.value,
        last_message_preview=None,
        last_message_at=conv.last_message_at,
    )


@router.get("/conversations/{conv_id}/messages", response_model=list[MessagePublic])
def list_messages(
    conv_id: int,
    current: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    after_id: int = Query(0, ge=0, description="Return only messages with id greater than this (polling cursor)"),
):
    conv = _conversation_for(db, conv_id, current)
    q = db.query(Message).filter(Message.conversation_id == conv.id)
    if after_id:
        q = q.filter(Message.id > after_id)
    return q.order_by(Message.created_at).limit(200).all()


@router.post("/conversations/{conv_id}/messages", response_model=MessagePublic, status_code=201)
def send_message(
    conv_id: int,
    payload: MessageCreate,
    current: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    conv = _conversation_for(db, conv_id, current)
    msg = Message(conversation_id=conv.id, sender_user_id=current.id, body=payload.body)
    conv.last_message_at = datetime.now(timezone.utc)
    db.add_all([msg, conv])
    db.commit()
    db.refresh(msg)
    return msg
