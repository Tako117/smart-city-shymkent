# backend/app/settings.py
from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    # API
    APP_TITLE: str = "Smart City Shymkent API"

    # CORS
    CORS_ORIGINS: tuple[str, ...] = (
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    )

    # Storage
    BASE_DIR: Path = Path(__file__).resolve().parents[1]  # backend/
    DATA_DIR: Path = BASE_DIR / "data"
    IMAGES_DIR: Path = DATA_DIR / "images"
    EXPORTS_DIR: Path = DATA_DIR / "exports"

    # Duplicate detection
    DUP_RADIUS_METERS: float = 250.0
    DUP_SCAN_LIMIT: int = 200

    # Priority thresholds
    PRIORITY_HIGH: float = 0.75
    PRIORITY_MEDIUM: float = 0.45


settings = Settings()

# Ensure dirs exist
os.makedirs(settings.IMAGES_DIR, exist_ok=True)
os.makedirs(settings.EXPORTS_DIR, exist_ok=True)
