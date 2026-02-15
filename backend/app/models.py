# backend/app/models.py
from sqlalchemy import String, Float, DateTime, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from .db import Base


class Complaint(Base):
    __tablename__ = "complaints"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    lang: Mapped[str] = mapped_column(String, default="ru")
    text: Mapped[str] = mapped_column(Text, default="")
    ui_category: Mapped[str] = mapped_column(String, default="")

    lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    lng: Mapped[float | None] = mapped_column(Float, nullable=True)

    image_path: Mapped[str] = mapped_column(String, default="")

    status: Mapped[str] = mapped_column(String, default="NEW")  # NEW|IN_PROGRESS|DONE|REJECTED

    # CV
    cv_label: Mapped[str] = mapped_column(String, default="")
    cv_score: Mapped[float] = mapped_column(Float, default=0.0)
    is_relevant: Mapped[str] = mapped_column(String, default="1")  # "1"/"0"

    # NLP
    nlp_category: Mapped[str] = mapped_column(String, default="")
    nlp_urgency: Mapped[str] = mapped_column(String, default="")
    nlp_confidence: Mapped[float] = mapped_column(Float, default=0.0)

    # Routing
    department: Mapped[str] = mapped_column(String, default="")
    routing_explain: Mapped[str] = mapped_column(Text, default="")

    # Duplicate / confirmations / priority
    duplicate_group_id: Mapped[str | None] = mapped_column(String, nullable=True)
    duplicates_count: Mapped[int] = mapped_column(Integer, default=0)
    confirmations: Mapped[int] = mapped_column(Integer, default=1)
    duplicate_of: Mapped[str | None] = mapped_column(String, nullable=True)  # id "главной" жалобы

    priority_score: Mapped[float] = mapped_column(Float, default=0.0)
    priority_level: Mapped[str] = mapped_column(String, default="LOW")  # LOW|MEDIUM|HIGH

    # Akimat pipeline (prototype)
    akimat_status: Mapped[str | None] = mapped_column(String, nullable=True)  # PREPARED|STUB_SENT|SENT|FAILED
    akimat_payload: Mapped[str | None] = mapped_column(Text, nullable=True)   # JSON string
    akimat_sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    @property
    def sent_to_akimat(self) -> bool:
        return self.akimat_status in ("STUB_SENT", "SENT")

    # Before / After
    after_image_path: Mapped[str | None] = mapped_column(String, nullable=True)
