# backend/app/services/stats.py
from __future__ import annotations
from datetime import datetime, timedelta, timezone
from collections import Counter, defaultdict
from sqlalchemy.orm import Session
from ..models import Complaint


def stats_summary(db: Session) -> dict:
    items = db.query(Complaint).all()

    by_status = Counter((c.status or "UNKNOWN") for c in items)
    by_category = Counter((getattr(c, "nlp_category", None) or c.ui_category or "UNKNOWN") for c in items)
    by_priority = Counter((getattr(c, "priority_level", None) or "MEDIUM") for c in items)

    return {
        "total": len(items),
        "by_status": dict(by_status),
        "by_category": dict(by_category),
        "by_priority": dict(by_priority),
    }


def stats_trends(db: Session, days: int = 7) -> dict:
    now = datetime.now(timezone.utc)
    start = now - timedelta(days=max(1, int(days)))

    items = (
        db.query(Complaint)
        .filter(Complaint.created_at.isnot(None))
        .all()
    )

    # bucket by date
    buckets = defaultdict(int)
    for c in items:
        dt = c.created_at
        if dt is None:
            continue
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        if dt < start:
            continue
        key = dt.date().isoformat()
        buckets[key] += 1

    # fill missing days
    out = []
    for i in range(days):
        d = (start + timedelta(days=i)).date().isoformat()
        out.append({"date": d, "count": buckets.get(d, 0)})

    return {"days": days, "series": out}


def stats_heatmap(db: Session, grid_size: float = 0.01) -> dict:
    """
    Очень простой heatmap-стаб:
    группируем по "сетке" (lat/lng округление).
    grid_size ~ 0.01 ≈ ~1км (примерно, зависит от широты).
    """
    pts = (
        db.query(Complaint)
        .filter(Complaint.lat.isnot(None))
        .filter(Complaint.lng.isnot(None))
        .all()
    )

    cells = defaultdict(int)
    for c in pts:
        lat = float(c.lat)
        lng = float(c.lng)
        key = (round(lat / grid_size) * grid_size, round(lng / grid_size) * grid_size)
        cells[key] += 1

    result = [{"lat": k[0], "lng": k[1], "count": v} for k, v in cells.items()]
    return {"grid_size": grid_size, "cells": result}
