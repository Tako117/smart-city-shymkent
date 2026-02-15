# backend/app/ai/cv_rules.py
from __future__ import annotations

# Набор "городских" классов, которые считаем релевантными инфраструктуре.
CITY_RELEVANT_LABELS = {
    "trash",
    "container",
    "pothole",
    "lighting",
    "playground",
}

# Все возможные классы (на будущее, чтобы стандартизировать)
ALL_LABELS = sorted(list(CITY_RELEVANT_LABELS | {"irrelevant", "other"}))

# Если хочешь — можно маппить к департаменту акимата (примерно)
DEPARTMENT_BY_LABEL = {
    "trash": "Коммунальные службы",
    "container": "Коммунальные службы",
    "pothole": "Дорожные службы",
    "lighting": "Городское освещение",
    "playground": "Благоустройство / Дворовые территории",
    "other": "Общий отдел обращений",
    "irrelevant": "—",
}

# Подсказки/описания для UI/аналитики
LABEL_DESCRIPTIONS_RU = {
    "trash": "Мусор/загрязнение",
    "container": "Контейнер/мусорная площадка",
    "pothole": "Ямы/повреждение дороги",
    "lighting": "Освещение/фонари",
    "playground": "Детская площадка",
    "other": "Другое",
    "irrelevant": "Нерелевантно",
}
