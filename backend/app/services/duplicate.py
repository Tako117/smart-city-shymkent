# backend/app/services/duplicate.py
from __future__ import annotations
from dataclasses import dataclass
from math import radians, cos, sin, asin, sqrt
from sqlalchemy.orm import Session
from ..models import Complaint


@dataclass
class DuplicateResult:
    group_id: str | None
    count: int


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Расстояние в метрах между двумя точками.
    """
    r = 6371000.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(a))
    return r * c


def find_duplicate_geo(
    *,
    db: Session,
    lat: float | None,
    lng: float | None,
    radius_m: float = 250.0,
    limit: int = 200,
) -> DuplicateResult:
    """
    Пока делаем просто geo-дубликаты:
    - ищем последние жалобы с координатами
    - если нашли близко → считаем это дублем
    """
    if lat is None or lng is None:
        return DuplicateResult(group_id=None, count=0)

    # Берём последние N жалоб и сравниваем координаты.
    # (Для SQLite без GIS это самый простой прототип)
    recent = (
        db.query(Complaint)
        .filter(Complaint.lat.isnot(None))
        .filter(Complaint.lng.isnot(None))
        .order_by(Complaint.created_at.desc())
        .limit(limit)
        .all()
    )

    best = None
    dup_count = 0

    for c in recent:
        try:
            dist = haversine_m(lat, lng, float(c.lat), float(c.lng))
        except Exception:
            continue
        if dist <= radius_m:
            # считаем дублем
            dup_count += 1
            if best is None:
                best = c

    if best is None:
        return DuplicateResult(group_id=None, count=0)

    group_id = getattr(best, "duplicate_group_id", None) or best.id
    return DuplicateResult(group_id=group_id, count=dup_count)
