# backend/app/schemas.py
from pydantic import BaseModel
from datetime import datetime


class ComplaintOut(BaseModel):
    id: str
    created_at: datetime

    lang: str
    text: str
    ui_category: str

    lat: float | None
    lng: float | None

    image_path: str
    after_image_path: str | None

    status: str

    cv_label: str
    cv_score: float
    is_relevant: str

    nlp_category: str
    nlp_urgency: str
    nlp_confidence: float

    department: str
    routing_explain: str

    priority_score: float
    priority_level: str

    confirmations: int
    duplicates_count: int
    duplicate_group_id: str | None
    duplicate_of: str | None

    sent_to_akimat: bool
    akimat_sent_at: datetime | None
    akimat_status: str | None

    class Config:
        from_attributes = True


class ComplaintPatch(BaseModel):
    status: str | None = None
