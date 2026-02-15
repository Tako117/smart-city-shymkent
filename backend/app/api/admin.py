# backend/app/api/admin.py
from __future__ import annotations

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Complaint
from ..settings import settings
from ..crud import get_complaint, update_complaint
from ..utils.files import save_image_bytes

router = APIRouter(prefix="/admin", tags=["admin"])


def _akimat_quality_gate(c: Complaint) -> tuple[bool, list[str]]:
    reasons: list[str] = []

    is_relevant = str(getattr(c, "is_relevant", "0")) in ("1", "true", "True")
    if not is_relevant:
        reasons.append("AI: нерелевантно городской инфраструктуре.")

    if not getattr(c, "image_path", None):
        reasons.append("Нет фото-доказательства.")

    text = (getattr(c, "text", "") or "").strip()
    if len(text) < 20 and float(getattr(c, "cv_score", 0.0) or 0.0) < 0.75:
        reasons.append("Недостаточно доказательств: короткий текст и низкая уверенность по фото.")

    if getattr(c, "lat", None) is None or getattr(c, "lng", None) is None:
        reasons.append("Нет координат (lat/lng).")

    # Не отправляем автоматически LOW
    pr = (getattr(c, "priority_level", "MEDIUM") or "MEDIUM").upper()
    if pr == "LOW":
        reasons.append("Низкий приоритет: отправка только вручную/после подтверждения.")

    ok = len(reasons) == 0
    return ok, reasons


def _build_payload(c: Complaint) -> dict:
    return {
        "service": "Smart City Shymkent",
        "type": "city_complaint",
        "complaint_id": c.id,
        "created_at": (c.created_at.isoformat() if c.created_at else None),
        "status": c.status,
        "location": {"lat": c.lat, "lng": c.lng},
        "message": {"lang": c.lang, "text": c.text},
        "ui_category": c.ui_category,
        "ai": {
            "cv_label": c.cv_label,
            "cv_score": c.cv_score,
            "is_relevant": c.is_relevant,
            "nlp_category": c.nlp_category,
            "nlp_urgency": c.nlp_urgency,
            "nlp_confidence": c.nlp_confidence,
        },
        "routing": {
            "department": c.department,
            "explain": c.routing_explain,
        },
        "priority": {
            "score": c.priority_score,
            "level": c.priority_level,
            "confirmations": c.confirmations,
            "duplicate_of": c.duplicate_of,
        },
        "attachments": [
            {"type": "image_before", "path": c.image_path},
        ],
    }


def _export_payload(payload: dict) -> str:
    file_path = settings.EXPORTS_DIR / f"akimat_payload_{payload.get('complaint_id')}.json"
    file_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return str(file_path)


@router.post("/akimat/prepare/{complaint_id}")
def prepare_akimat(complaint_id: str, db: Session = Depends(get_db)):
    c = get_complaint(db, complaint_id)
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")

    ok, reasons = _akimat_quality_gate(c)
    if not ok:
        return {"ok": False, "reasons": reasons, "payload": None, "export_path": None}

    payload = _build_payload(c)
    export_path = _export_payload(payload)
    return {"ok": True, "reasons": [], "payload": payload, "export_path": export_path}


@router.get("/akimat/payload/{complaint_id}")
def get_akimat_payload(complaint_id: str, db: Session = Depends(get_db)):
    c = get_complaint(db, complaint_id)
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")

    payload = _build_payload(c)
    return payload


@router.post("/akimat/send/{complaint_id}")
def send_akimat_stub(complaint_id: str, db: Session = Depends(get_db)):
    """
    Заглушка отправки:
    - НИЧЕГО реально не отправляет
    - Только помечает sent_to_akimat и время
    """
    c = get_complaint(db, complaint_id)
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")

    ok, reasons = _akimat_quality_gate(c)
    if not ok:
        return {"sent": False, "mode": "stub", "reasons": reasons}

    c.sent_to_akimat = True
    c.akimat_sent_at = datetime.now(timezone.utc)
    update_complaint(db, c)

    payload = _build_payload(c)
    export_path = _export_payload(payload)

    return {
        "sent": False,
        "mode": "stub",
        "message": "Заглушка: реальная интеграция с акиматом не подключена.",
        "akimat_marked": True,
        "export_path": export_path,
    }


@router.post("/complaints/{complaint_id}/after_photo")
async def upload_after_photo(
    complaint_id: str,
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    MVP before/after:
    Сейчас в модели нет after_image_path, поэтому:
    - сохраняем файл
    - возвращаем путь
    Позже добавим поле в Complaint и начнём хранить в БД.
    """
    c = get_complaint(db, complaint_id)
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")

    ext = (photo.filename.split(".")[-1] or "jpg").lower()
    content = await photo.read()
    after_path = save_image_bytes(f"{complaint_id}_after", content, ext=ext)

    return {"ok": True, "complaint_id": complaint_id, "after_image_path": after_path}
