# backend/app/ai/router.py

def route(cv_label: str, nlp_category: str, nlp_urgency: str, is_relevant: bool) -> dict:
    if not is_relevant:
        return {
            "department": "REJECTED",
            "routing_explain": "CV-модуль определил изображение как нерелевантное городской проблеме или уверенность ниже порога.",
        }

    # Нормализуем до “тем”
    theme = None

    # 1) Приоритет CV (изображение сильнее для объектов)
    if "trash" in cv_label or "container" in cv_label or "dumpster" in cv_label:
        theme = "waste"
    elif "playground" in cv_label:
        theme = "playground"
    elif "lighting" in cv_label or "lamp" in cv_label:
        theme = "lighting"
    elif "road" in cv_label or "pothole" in cv_label or "sidewalk" in cv_label:
        theme = "road"

    # 2) NLP как уточнение/резерв
    if theme is None:
        if "trash" in nlp_category or "illegal dump" in nlp_category or "litter" in nlp_category:
            theme = "waste"
        elif "playground" in nlp_category:
            theme = "playground"
        elif "lighting" in nlp_category:
            theme = "lighting"
        elif "road" in nlp_category or "pavement" in nlp_category:
            theme = "road"
        else:
            theme = "other"

    # 3) Маппинг инстанций
    if theme == "waste":
        dept = "Коммунальные службы / Санитария"
    elif theme == "lighting":
        dept = "Горсвет / Отдел освещения"
    elif theme == "playground":
        dept = "Благоустройство / ЖКХ"
    elif theme == "road":
        dept = "Дорожная служба / Транспорт"
    else:
        dept = "Единая диспетчерская"

    explain = (
        f"Решение маршрутизации:\n"
        f"- CV: {cv_label}\n"
        f"- NLP: {nlp_category}\n"
        f"- Срочность: {nlp_urgency}\n"
        f"- Итоговая тема: {theme}\n"
        f"- Инстанция: {dept}"
    )

    return {"department": dept, "routing_explain": explain}