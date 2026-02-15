import { CATEGORIES } from "./departments.js";

// “AI” имитация:
// 1) Если имя файла содержит ключевые слова — угадываем категорию
// 2) Иначе: лёгкая рандомизация вокруг выбранной категории
export function detectCategoryAI({ fileName = "", userCategory = "" }) {
  const name = (fileName || "").toLowerCase();

  const rules = [
    { keys: ["light", "lamp", "фонар", "свет"], cat: "Плохое/отсутствующее уличное освещение" },
    { keys: ["road", "hole", "яма", "тротуар"], cat: "Ямы, повреждённые тротуары" },
    { keys: ["play", "swing", "горк", "качел", "площадк"], cat: "Сломанные детские площадки" },
    { keys: ["dump", "свалк"], cat: "Стихийные свалки" },
    { keys: ["bin", "trash", "мусор", "контейнер"], cat: "Переполненные мусорные контейнеры" },
  ];

  for (const r of rules) {
    if (r.keys.some((k) => name.includes(k))) return r.cat;
  }

  // рандомизация: 70% оставляем как выбрал пользователь, 30% — соседняя категория
  const base = userCategory && CATEGORIES.includes(userCategory)
    ? userCategory
    : "Другое (свободное описание)";

  const roll = Math.random();
  if (roll < 0.7) return base;

  const alt = CATEGORIES.filter((c) => c !== base);
  return alt[Math.floor(Math.random() * alt.length)];
}