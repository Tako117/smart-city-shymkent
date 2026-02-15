# backend/app/api/stats.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..db import get_db
from ..services.stats import stats_summary, stats_trends, stats_heatmap

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    """
    Общая статистика:
    - общее количество
    - по статусам
    - по категориям
    - по приоритетам
    """
    return stats_summary(db)


@router.get("/trends")
def get_trends(days: int = 7, db: Session = Depends(get_db)):
    """
    Тренды за N дней
    """
    return stats_trends(db, days)


@router.get("/heatmap")
def get_heatmap(grid_size: float = 0.01, db: Session = Depends(get_db)):
    """
    Простая heatmap-агрегация
    """
    return stats_heatmap(db, grid_size)
