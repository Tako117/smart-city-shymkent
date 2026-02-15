# backend/app/crud.py
from __future__ import annotations

from sqlalchemy.orm import Session

from .models import Complaint
from .schemas import ComplaintPatch


def get_complaint(db: Session, complaint_id: str) -> Complaint | None:
    return db.get(Complaint, complaint_id)


def list_complaints(db: Session) -> list[Complaint]:
    return db.query(Complaint).order_by(Complaint.created_at.desc()).all()


def create_complaint(db: Session, obj: Complaint) -> Complaint:
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_complaint(db: Session, obj: Complaint) -> Complaint:
    db.commit()
    db.refresh(obj)
    return obj


def apply_patch(db: Session, obj: Complaint, payload: ComplaintPatch) -> Complaint:
    if payload.status is not None:
        obj.status = payload.status

    if payload.confirmations is not None:
        obj.confirmations = int(payload.confirmations)

    db.commit()
    db.refresh(obj)
    return obj
