// frontend/src/libb/api.js
const API_BASE = import.meta.env.VITE_API_URL;

async function handle(res) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  // некоторые ответы могут быть пустыми
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

export async function createComplaint({ file, text, uiCategory, lat, lng, lang }) {
  const fd = new FormData();
  fd.append("photo", file);
  fd.append("text", text ?? "");
  fd.append("ui_category", uiCategory ?? "");
  fd.append("lat", lat ?? "");
  fd.append("lng", lng ?? "");
  fd.append("lang", lang ?? "ru");

  const res = await fetch(`${API_BASE}/complaints`, {
    method: "POST",
    body: fd,
  });
  return handle(res);
}

export async function listComplaints() {
  const res = await fetch(`${API_BASE}/complaints`, { method: "GET" });
  return handle(res);
}

export async function patchComplaint(id, { status }) {
  const res = await fetch(`${API_BASE}/complaints/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return handle(res);
}

export async function statsSummary() {
  const res = await fetch(`${API_BASE}/stats/summary`, { method: "GET" });
  return handle(res);
}

export async function statsTrends(days = 7) {
  const res = await fetch(`${API_BASE}/stats/trends?days=${days}`, { method: "GET" });
  return handle(res);
}

export async function statsHeatmap(gridSize = 0.01) {
  const res = await fetch(`${API_BASE}/stats/heatmap?grid_size=${gridSize}`, { method: "GET" });
  return handle(res);
}
