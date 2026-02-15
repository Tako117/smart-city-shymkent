# backend/app/main.py
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uuid
import json
from datetime import datetime, timezone

from .db import Base, engine, get_db
from .models import Complaint
from .schemas import ComplaintOut, ComplaintPatch
from .utils.files import save_image_bytes

from .ai.cv_clip import classify_image
from .ai.nlp_zero_shot import analyze_text
from .ai.router import route

from .services.priority import compute_priority
from .services.duplicate import find_duplicate_geo
from .services.akimat import prepare_akimat_payload, send_to_akimat_stub, export_payload_json
from .services.notifications import notify_mock
from .services.stats import stats_summary, stats_trends, stats_heatmap

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Smart City Shymkent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health():
    return {"status": "ok", "service": "Smart City Shymkent API"}


def _safe_float(v: str) -> float | None:
    if not v:
        return None
    s = v.strip()
    if not s:
        return None
    try:
        return float(s)
    except Exception:
        return None


@app.post("/complaints", response_model=ComplaintOut)
async def create_complaint(
    photo: UploadFile = File(...),
    text: str = Form(""),
    ui_category: str = Form(""),
    lat: str = Form(""),
    lng: str = Form(""),
    lang: str = Form("ru"),
    db: Session = Depends(get_db),
):
    complaint_id = str(uuid.uuid4())

    # 1) save image
    ext = (photo.filename.split(".")[-1] or "jpg").lower()
    content = await photo.read()
    image_path = save_image_bytes(complaint_id, content, ext=ext)

    # 2) CV
    cv = classify_image(image_path)

    # 3) NLP
    nlp = analyze_text(text, lang)

    # 4) Routing
    routing = route(
        cv_label=cv.get("cv_label", ""),
        nlp_category=nlp.get("nlp_category", ""),
        nlp_urgency=nlp.get("nlp_urgency", "LOW"),
        is_relevant=bool(cv.get("is_relevant", True)),
    )

    is_relevant = bool(cv.get("is_relevant", True))
    status = "REJECTED" if not is_relevant else "NEW"

    lat_val = _safe_float(lat)
    lng_val = _safe_float(lng)

    # 5) duplicate detection (geo MVP)
    dup = find_duplicate_geo(db=db, lat=lat_val, lng=lng_val, radius_m=250.0)
    dup_group_id = getattr(dup, "group_id", None)
    dup_count = int(getattr(dup, "count", 0) or 0)
    dup_of = getattr(dup, "duplicate_of", None)  # может быть None

    # 6) priority
    pr = compute_priority(
        confirmations=1,
        created_at=datetime.now(timezone.utc),
        object_type="unknown",
        urgency=nlp.get("nlp_urgency", "LOW"),
        is_relevant=is_relevant,
        duplicates_count=dup_count,
    )

    obj = Complaint(
        id=complaint_id,
        lang=lang,
        text=text,
        ui_category=ui_category,
        lat=lat_val,
        lng=lng_val,
        image_path=image_path,
        status=status,

        cv_label=cv.get("cv_label", ""),
        cv_score=float(cv.get("cv_score", 0.0) or 0.0),
        is_relevant="1" if is_relevant else "0",

        nlp_category=nlp.get("nlp_category", ""),
        nlp_urgency=nlp.get("nlp_urgency", "LOW"),
        nlp_confidence=float(nlp.get("nlp_confidence", 0.0) or 0.0),

        department=routing.get("department", ""),
        routing_explain=routing.get("routing_explain", ""),

        duplicate_group_id=dup_group_id,
        duplicates_count=dup_count,
        duplicate_of=dup_of,
        confirmations=1,

        priority_score=float(pr.score),
        priority_level=str(pr.level),

        akimat_status=None,
        akimat_payload=None,
        akimat_sent_at=None,

        after_image_path=None,
    )

    db.add(obj)
    db.commit()
    db.refresh(obj)

    notify_mock("complaint_created", {"id": obj.id, "status": obj.status, "priority": obj.priority_level})
    return obj


@app.get("/complaints", response_model=list[ComplaintOut])
def list_complaints(db: Session = Depends(get_db)):
    return db.query(Complaint).order_by(Complaint.created_at.desc()).all()


@app.patch("/complaints/{complaint_id}", response_model=ComplaintOut)
def patch_complaint(complaint_id: str, payload: ComplaintPatch, db: Session = Depends(get_db)):
    obj = db.get(Complaint, complaint_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if payload.status:
        obj.status = payload.status

    db.commit()
    db.refresh(obj)
    notify_mock("complaint_updated", {"id": obj.id, "status": obj.status})
    return obj


@app.post("/complaints/{complaint_id}/after_photo", response_model=ComplaintOut)
async def upload_after_photo(
    complaint_id: str,
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    obj = db.get(Complaint, complaint_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Complaint not found")

    ext = (photo.filename.split(".")[-1] or "jpg").lower()
    content = await photo.read()
    after_path = save_image_bytes(f"{complaint_id}_after", content, ext=ext)
    obj.after_image_path = after_path

    db.commit()
    db.refresh(obj)
    notify_mock("after_photo_uploaded", {"id": obj.id})
    return obj


@app.post("/complaints/{complaint_id}/prepare_akimat")
def prepare_for_akimat(complaint_id: str, db: Session = Depends(get_db)):
    obj = db.get(Complaint, complaint_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Complaint not found")

    gate = prepare_akimat_payload(obj)
    if not gate.ok:
        return {"ok": False, "reasons": gate.reasons, "payload": None}

    payload = gate.payload

    obj.akimat_status = "PREPARED"
    obj.akimat_payload = json.dumps(payload, ensure_ascii=False)
    db.commit()
    db.refresh(obj)

    return {"ok": True, "reasons": [], "payload": payload}


@app.post("/complaints/{complaint_id}/send_to_akimat")
def send_to_akimat(complaint_id: str, db: Session = Depends(get_db)):
    obj = db.get(Complaint, complaint_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if not obj.akimat_payload:
        raise HTTPException(status_code=400, detail="Not prepared. Call /prepare_akimat first.")

    payload = json.loads(obj.akimat_payload)

    export_path = export_payload_json(payload, export_dir="data/exports")
    result = send_to_akimat_stub(payload)

    obj.akimat_status = "STUB_SENT"
    obj.akimat_sent_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(obj)

    notify_mock("akimat_stub_sent", {"id": obj.id, "export": export_path})
    return {**result, "export_path": export_path}


@app.get("/stats/summary")
def get_stats_summary(db: Session = Depends(get_db)):
    return stats_summary(db)


@app.get("/stats/trends")
def get_stats_trends(days: int = 7, db: Session = Depends(get_db)):
    return stats_trends(db, days=days)


@app.get("/stats/heatmap")
def get_stats_heatmap(grid_size: float = 0.01, db: Session = Depends(get_db)):
    return stats_heatmap(db, grid_size=grid_size)
