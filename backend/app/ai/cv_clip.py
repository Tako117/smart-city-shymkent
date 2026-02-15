# backend/app/ai/cv_clip.py
from PIL import Image
import torch
from transformers import CLIPProcessor, CLIPModel

# Классы (строго по ТЗ)
LABELS = [
    "trash and litter on street",
    "garbage container / dumpster",
    "children playground equipment",
    "street lighting / lamp post",
    "road / pothole / sidewalk",
    "irrelevant photo (not city issue)",
]

_model = None
_processor = None

def _load():
    global _model, _processor
    if _model is None:
        _model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        _processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        _model.eval()
    return _model, _processor

def classify_image(image_path: str) -> dict:
    """
    Returns:
      {
        "cv_label": <one of defined labels mapped to RU/KZ/EN on frontend>,
        "cv_score": float [0..1],
        "is_relevant": bool
      }
    """
    model, processor = _load()

    image = Image.open(image_path).convert("RGB")
    inputs = processor(text=LABELS, images=image, return_tensors="pt", padding=True)

    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits_per_image  # [1, num_labels]
        probs = logits.softmax(dim=1).cpu().numpy()[0]

    best_idx = int(probs.argmax())
    best_label = LABELS[best_idx]
    best_score = float(probs[best_idx])

    # Порог релевантности: если модель уверена, что "нерелевантно" или низкая уверенность
    is_irrelevant = (best_label == "irrelevant photo (not city issue)")
    is_relevant = (not is_irrelevant) and (best_score >= 0.35)

    return {
        "cv_label": best_label,
        "cv_score": best_score,
        "is_relevant": is_relevant,
    }