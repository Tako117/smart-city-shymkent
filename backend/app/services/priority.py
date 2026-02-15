# backend/app/services/priority.py
from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime, timezone

URG_WEIGHT = {"low": 0.2, "medium": 0.6, "high": 1.0}
OBJ_WEIGHT = {
    "hospital": 1.0,
    "school": 0.9,
    "main_road": 0.8,
    "road": 0.7,
    "yard": 0.5,
    "other": 0.4,
    "unknown": 0.4,
}

@dataclass
class PriorityResult:
    score: float
    level: str  # HIGH | MEDIUM | LOW


def _clamp01(x: float) -> float:
    if x < 0:
        return 0.0
    if x > 1:
        return 1.0
    return x


def compute_priority(
    *,
    confirmations: int,
    created_at: datetime | None,
    object_type: str | None,
    urgency: str | None,
    is_relevant: bool,
    duplicates_count: int = 0,
) -> PriorityResult:
    """
    Реалистичный priority score:
    - срочность (из NLP)
    - подтверждения (confirmations + duplicates)
    - время ожидания
    - тип объекта (школа/больница/дорога)
    """

    if not is_relevant:
        return PriorityResult(score=0.0, level="LOW")

    urg = URG_WEIGHT.get((urgency or "medium").lower(), 0.6)
    obj = OBJ_WEIGHT.get((object_type or "unknown").lower(), 0.4)

    conf_total = max(1, int(confirmations)) + max(0, int(duplicates_count))
    confirmations_norm = _clamp01(conf_total / 10.0)

    if created_at is None:
        waiting_norm = 0.0
    else:
        now = datetime.now(timezone.utc)
        ca = created_at
        if ca.tzinfo is None:
            ca = ca.replace(tzinfo=timezone.utc)
        days = max(0.0, (now - ca).total_seconds() / 86400.0)
        waiting_norm = _clamp01(days / 7.0)

    # Веса: можно потом тюнить
    score = (
        0.35 * urg
        + 0.25 * confirmations_norm
        + 0.20 * waiting_norm
        + 0.20 * obj
    )

    if score >= 0.75:
        level = "HIGH"
    elif score >= 0.45:
        level = "MEDIUM"
    else:
        level = "LOW"

    return PriorityResult(score=round(float(score), 3), level=level)
