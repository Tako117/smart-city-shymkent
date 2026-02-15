const KEY = "scs_reports_v1";

export function loadReports() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveReports(reports) {
  localStorage.setItem(KEY, JSON.stringify(reports));
}

export function addReport(report) {
  const reports = loadReports();
  reports.unshift(report);
  saveReports(reports);
  return reports;
}

export function updateReportStatus(id, status) {
  const reports = loadReports();
  const idx = reports.findIndex((r) => r.id === id);
  if (idx >= 0) {
    reports[idx] = { ...reports[idx], status };
    saveReports(reports);
  }
  return reports;
}

export function seedDemoDataIfEmpty() {
  const existing = loadReports();
  if (existing.length > 0) return;

  const now = new Date();
  const daysAgo = (n) => new Date(now.getTime() - n * 24 * 3600 * 1000).toISOString();

  const demo = [
    {
      id: crypto.randomUUID(),
      photoDataUrl: "",
      category: "Ямы, повреждённые тротуары",
      aiCategory: "Ямы, повреждённые тротуары",
      description: "Опасная яма у перехода.",
      lat: 42.315, lng: 69.586,
      addressHint: "Рядом со школой",
      status: "Новая",
      department: "Управление транспорта / Дорожная служба",
      createdAt: daysAgo(0),
    },
    {
      id: crypto.randomUUID(),
      photoDataUrl: "",
      category: "Плохое/отсутствующее уличное освещение",
      aiCategory: "Плохое/отсутствующее уличное освещение",
      description: "Фонарь не работает, вечером темно.",
      lat: 42.31, lng: 69.59,
      addressHint: "Двор 12 дома",
      status: "В работе",
      department: "Горсвет / Управление энергетики",
      createdAt: daysAgo(2),
    },
    {
      id: crypto.randomUUID(),
      photoDataUrl: "",
      category: "Переполненные мусорные контейнеры",
      aiCategory: "Переполненные мусорные контейнеры",
      description: "Контейнеры переполнены несколько дней.",
      lat: 42.32, lng: 69.58,
      addressHint: "Остановка",
      status: "Решена",
      department: "ТОО «Таза Өлке» / Управление санитарии",
      createdAt: daysAgo(5),
    },
  ];

  saveReports(demo);
}