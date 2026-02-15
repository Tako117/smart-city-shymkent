# backend/app/api/complaints.py
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Complaint
from ..schemas import ComplaintOut, ComplaintPatch
from ..utils.files import save_image_bytes
from ..settings import settings

from ..ai.cv_clip import classify_image
from ..ai.nlp_zero_shot import analyze_text
from ..ai.router import route

from ..crud import get_complaint, list_complaints, create_complaint as crud_create, apply_patch

router = APIRouter(prefix="/complaints", tags=["complaints"])


# ---- helpers ----
def _haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    from math import radians, cos, sin, asin, sqrt

    r = 6371000.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(a))
    return r * c


def _find_geo_duplicate(db: Session, lat: float | None, lng: float | None) -> str | None:
    """
    MVP: если есть жалоба в радиусе settings.DUP_RADIUS_METERS — считаем дублем.
    Возвращаем id "оригинала".
    """
    if lat is None or lng is None:
        return None

    recent = (
        db.query(Complaint)
        .filter(Complaint.lat.isnot(None))
        .filter(Complaint.lng.isnot(None))
        .order_by(Complaint.created_at.desc())
        .limit(settings.DUP_SCAN_LIMIT)
        .all()
    )

    for c in recent:
        try:
            dist = _haversine_m(lat, lng, float(c.lat), float(c.lng))
        except Exception:
            continue
        if dist <= settings.DUP_RADIUS_METERS:
            return c.id

    return None


def _priority_score(urgency: str, confirmations: int, created_at: datetime) -> tuple[float, str]:
    """
    Реалистичная простая формула:
    - urgency: low/medium/high
    - confirmations: подтверждения/дубликаты
    - waiting time
    """
    urg_map = {"low": 0.2, "medium": 0.6, "high": 1.0}
    urg = urg_map.get((urgency or "medium").lower(), 0.6)

    conf_norm = min(max(confirmations, 0) / 10.0, 1.0)

    now = datetime.now(timezone.utc)
    ca = created_at
    if ca.tzinfo is None:
        ca = ca.replace(tzinfo=timezone.utc)
    days = max(0.0, (now - ca).total_seconds() / 86400.0)
    wait_norm = min(days / 7.0, 1.0)

    score = (0.40 * urg) + (0.35 * conf_norm) + (0.25 * wait_norm)

    if score >= settings.PRIORITY_HIGH:
        level = "HIGH"
    elif score >= settings.PRIORITY_MEDIUM:
        level = "MEDIUM"
    else:
        level = "LOW"

    return round(float(score), 3), level


# ---- endpoints ----
@router.post("", response_model=ComplaintOut)
async def create(
    photo: UploadFile = File(...),
    text: str = Form(""),
    ui_category: str = Form(""),
    lat: str = Form(""),
    lng: str = Form(""),
    lang: str = Form("ru"),
    db: Session = Depends(get_db),
):
    complaint_id = str(uuid.uuid4())

    # Save image
    ext = (photo.filename.split(".")[-1] or "jpg").lower()
    content = await photo.read()
    image_path = save_image_bytes(complaint_id, content, ext=ext)

    # Parse geo
    lat_val = float(lat) if str(lat).strip() else None
    lng_val = float(lng) if str(lng).strip() else None

    # AI
    cv = classify_image(image_path)
    nlp = analyze_text(text, lang)
    routing = route(
        cv_label=cv["cv_label"],
        nlp_category=nlp["nlp_category"],
        nlp_urgency=nlp["nlp_urgency"],
        is_relevant=cv["is_relevant"],
    )

    status = "REJECTED" if not cv["is_relevant"] else "NEW"

    # Duplicate (geo MVP)
    duplicate_of = _find_geo_duplicate(db, lat_val, lng_val)

    # confirmations: если это дубль — увеличим подтверждения у оригинала
    confirmations = 1
    if duplicate_of:
        orig = get_complaint(db, duplicate_of)
        if orig:
            orig.confirmations = int(orig.confirmations or 0) + 1
            db.commit()
        confirmations = 0  # сам дубль не считается отдельным подтверждением

    created_at = datetime.utcnow()
    score, level = _priority_score(nlp.get("nlp_urgency", "medium"), max(1, confirmations), created_at)

    obj = Complaint(
        id=complaint_id,
        created_at=created_at,

        lang=lang,
        text=text or "",
        ui_category=ui_category or "",
        lat=lat_val,
        lng=lng_val,
        image_path=image_path,
        status=status,

        cv_label=cv.get("cv_label", ""),
        cv_score=float(cv.get("cv_score", 0.0) or 0.0),
        is_relevant="1" if cv.get("is_relevant", False) else "0",

        nlp_category=nlp.get("nlp_category", ""),
        nlp_urgency=nlp.get("nlp_urgency", ""),
        nlp_confidence=float(nlp.get("nlp_confidence", 0.0) or 0.0),

        department=routing.get("department", ""),
        routing_explain=routing.get("routing_explain", ""),

        priority_score=score,
        priority_level=level,
        confirmations=confirmations,

        duplicate_of=duplicate_of,

        sent_to_akimat=False,
        akimat_sent_at=None,
    )

    return crud_create(db, obj)


@router.get("", response_model=list[ComplaintOut])
def get_all(db: Session = Depends(get_db)):
    return list_complaints(db)


@router.patch("/{complaint_id}", response_model=ComplaintOut)
def patch(complaint_id: str, payload: ComplaintPatch, db: Session = Depends(get_db)):
    obj = get_complaint(db, complaint_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return apply_patch(db, obj, payload)
