# backend/app/utils/files.py
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
IMAGES_DIR = DATA_DIR / "images"
IMAGES_DIR.mkdir(parents=True, exist_ok=True)

def save_image_bytes(complaint_id: str, content: bytes, ext: str = "jpg") -> str:
    path = IMAGES_DIR / f"{complaint_id}.{ext}"
    path.write_bytes(content)
    return str(path)