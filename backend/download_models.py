# backend/download_models.py
import os

# Куда кешировать модели на Render (быстрее и стабильнее)
os.environ.setdefault("HF_HOME", "/opt/render/project/.cache/huggingface")
os.environ.setdefault("TRANSFORMERS_CACHE", "/opt/render/project/.cache/huggingface/transformers")
os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")

def main():
    # NLP модель
    from transformers import AutoTokenizer, AutoModelForSequenceClassification

    nlp_model = "joeddav/xlm-roberta-large-xnli"
    AutoTokenizer.from_pretrained(nlp_model)
    AutoModelForSequenceClassification.from_pretrained(nlp_model)

    # CLIP модель (если у тебя в cv_clip.py используется именно эта)
    from transformers import CLIPProcessor, CLIPModel

    clip_model = "openai/clip-vit-base-patch32"
    CLIPProcessor.from_pretrained(clip_model)
    CLIPModel.from_pretrained(clip_model)

    print("✅ Models downloaded & cached successfully.")

if __name__ == "__main__":
    main()
