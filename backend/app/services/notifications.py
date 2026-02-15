# backend/app/services/notifications.py
from __future__ import annotations
from datetime import datetime, timezone

def notify_mock(event: str, payload: dict) -> None:
    """
    Пока без email. Просто логируем.
    Позже можно заменить на реальный SMTP/SendGrid/Firebase.
    """
    ts = datetime.now(timezone.utc).isoformat()
    print(f"[NOTIFY][{ts}] {event}: {payload}")
