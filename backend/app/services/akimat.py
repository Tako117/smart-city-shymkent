# backend/app/services/akimat.py
from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Any

from ..models import Complaint


@dataclass
class AkimatGateResult:
    ok: bool
    reasons: list[str]
    payload: dict[str, Any] | None


def _text_ok(text: str) -> bool:
    t = (text or "").strip()
    return len(t) >= 20


def prepare_akimat_payload(complaint: Complaint) -> AkimatGateResult:
    """
    AI/качество-гейт:
    - релевантность
    - наличие фото
    - достаточность текста или высокая уверенность CV
    - координаты (или хотя бы что-то одно)
    - приоритет не LOW (можно менять)
    """
    reasons: list[str] = []

    is_relevant = str(getattr(complaint, "is_relevant", "0")) in ("1", "true", "True")
    if not is_relevant:
        reasons.append("Нерелевантно городской инфраструктуре (AI).")

    if not getattr(complaint, "image_path", None):
        reasons.append("Нет фото-доказательства.")

    text = getattr(complaint, "text", "") or ""
    cv_score = float(getattr(complaint, "cv_score", 0.0) or 0.0)

    if not _text_ok(text) and cv_score < 0.75:
        reasons.append("Недостаточно доказательств: текст слишком короткий и низкая уверенность по фото.")

    lat = getattr(complaint, "lat", None)
    lng = getattr(complaint, "lng", None)
    if lat is None or lng is None:
        reasons.append("Нет координат (lat/lng).")

    priority_level = (getattr(complaint, "priority_level", None) or "").upper()
    if priority_level in ("", None):
        priority_level = "MEDIUM"

    if priority_level == "LOW":
        reasons.append("Низкий приоритет — не отправляем автоматически.")

    ok = len(reasons) == 0

    if not ok:
        return AkimatGateResult(ok=False, reasons=reasons, payload=None)

    # Структурированный payload (можно легко конвертировать в PDF/Excel/email)
    payload = {
        "service": "Smart City Shymkent",
        "type": "city_complaint",
        "complaint_id": complaint.id,
        "created_at": _dt_iso(getattr(complaint, "created_at", None)),
        "status": getattr(complaint, "status", None),

        "location": {
            "lat": float(lat),
            "lng": float(lng),
        },
        "ui_category": getattr(complaint, "ui_category", None),
        "ai": {
            "cv_label": getattr(complaint, "cv_label", None),
            "cv_score": float(getattr(complaint, "cv_score", 0.0) or 0.0),
            "nlp_category": getattr(complaint, "nlp_category", None),
            "nlp_urgency": getattr(complaint, "nlp_urgency", None),
            "nlp_confidence": float(getattr(complaint, "nlp_confidence", 0.0) or 0.0),
        },
        "priority": {
            "score": float(getattr(complaint, "priority_score", 0.0) or 0.0),
            "level": priority_level,
        },
        "routing": {
            "department": getattr(complaint, "department", None),
            "explain": getattr(complaint, "routing_explain", None),
        },
        "message": {
            "lang": getattr(complaint, "lang", None),
            "text": text,
        },
        "attachments": [
            {
                "type": "image",
                "path": getattr(complaint, "image_path", None),
            }
        ],
    }

    return AkimatGateResult(ok=True, reasons=[], payload=payload)


def send_to_akimat_stub(payload: dict[str, Any]) -> dict[str, Any]:
    """
    Заглушка: ничего никуда не отправляет.
    Просто возвращает "как будто отправили".
    """
    return {
        "sent": False,
        "mode": "stub",
        "message": "Это заглушка. Реальная отправка в акимат не подключена.",
        "prepared_at": datetime.now(timezone.utc).isoformat(),
        "payload_preview": payload,
    }


def export_payload_json(payload: dict[str, Any], export_dir: str) -> str:
    """
    Экспорт в JSON файл (как часть прототипа передачи).
    """
    Path(export_dir).mkdir(parents=True, exist_ok=True)
    file_path = Path(export_dir) / f"akimat_payload_{payload.get('complaint_id','unknown')}.json"
    file_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return str(file_path)


def _dt_iso(dt) -> str | None:
    if dt is None:
        return None
    try:
        return dt.isoformat()
    except Exception:
        return None
