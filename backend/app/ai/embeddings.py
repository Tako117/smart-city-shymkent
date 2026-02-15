# backend/app/ai/embeddings.py
from __future__ import annotations

from functools import lru_cache
from typing import List

import torch
from PIL import Image
from transformers import CLIPModel, CLIPProcessor


MODEL_NAME = "openai/clip-vit-base-patch32"


@lru_cache(maxsize=1)
def _load_clip():
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = CLIPModel.from_pretrained(MODEL_NAME).to(device)
    processor = CLIPProcessor.from_pretrained(MODEL_NAME)
    model.eval()
    return model, processor, device


def image_embedding(image_path: str) -> List[float]:
    """
    Возвращает L2-нормализованный embedding изображения (list[float]).
    Используется для duplicate detection (cosine similarity).
    """
    model, processor, device = _load_clip()

    img = Image.open(image_path).convert("RGB")
    inputs = processor(images=img, return_tensors="pt")
    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.no_grad():
        feats = model.get_image_features(**inputs)  # [1, D]
        feats = feats / feats.norm(dim=-1, keepdim=True).clamp(min=1e-12)

    return feats.squeeze(0).detach().cpu().tolist()


def cosine_similarity(a: List[float], b: List[float]) -> float:
    """
    Cosine similarity для 2 списков одинаковой длины.
    """
    if len(a) != len(b) or len(a) == 0:
        return 0.0
    ta = torch.tensor(a)
    tb = torch.tensor(b)
    return float(torch.nn.functional.cosine_similarity(ta, tb, dim=0).item())
