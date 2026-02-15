# backend/app/ai/nlp_zero_shot.py
from transformers import pipeline

# Категории (семантически привязаны к вашему MVP)
CATEGORIES = [
    "trash issue",
    "illegal dump",
    "yard/road litter",
    "broken playground",
    "street lighting problem",
    "road/pavement problem",
    "other city issue",
]

URGENCY = [
    "high urgency (dangerous, needs immediate fix)",
    "medium urgency",
    "low urgency",
]

_zs = None

def _load():
    global _zs
    if _zs is None:
        _zs = pipeline(
            "zero-shot-classification",
            model="joeddav/xlm-roberta-large-xnli",
        )
    return _zs

def analyze_text(text: str, lang: str) -> dict:
    """
    Returns:
      {
        "nlp_category": str,
        "nlp_confidence": float,
        "nlp_urgency": str,
        "urgency_confidence": float
      }
    """
    zs = _load()
    txt = (text or "").strip()
    if not txt:
        return {
            "nlp_category": "other city issue",
            "nlp_confidence": 0.0,
            "nlp_urgency": "low urgency",
            "urgency_confidence": 0.0,
        }

    cat = zs(txt, CATEGORIES, multi_label=False)
    urg = zs(txt, URGENCY, multi_label=False)

    return {
        "nlp_category": cat["labels"][0],
        "nlp_confidence": float(cat["scores"][0]),
        "nlp_urgency": urg["labels"][0],
        "urgency_confidence": float(urg["scores"][0]),
    }