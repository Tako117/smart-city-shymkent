// src/pages/Admin.jsx
import React, { useEffect, useMemo, useState } from "react";
import { t } from "../i18n/index.js";
import { listComplaints, patchComplaint } from "../libb/api.js";
import CityMap from "../components/CityMap.jsx";

const UI_CATEGORIES = [
  "Все",
  "Переполненные мусорные контейнеры",
  "Стихийные свалки",
  "Мусор во дворах и вдоль дорог",
  "Сломанные детские площадки",
  "Плохое/отсутствующее уличное освещение",
  "Ямы, повреждённые тротуары",
  "Другое (свободное описание)"
];

const STATUS = ["Все", "NEW", "IN_PROGRESS", "DONE", "REJECTED"];

function dayKey(iso) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function lastNDaysKeys(n = 7) {
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    out.push(`${y}-${m}-${day}`);
  }
  return out;
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function buildGridHotspots(reports, gridSize = 0.01) {
  const map = new Map(); // key -> { key, lat, lng, count, done, active }
  for (const r of reports) {
    const lat = toNum(r.lat);
    const lng = toNum(r.lng);
    if (lat == null || lng == null) continue;

    const glat = Math.floor(lat / gridSize) * gridSize;
    const glng = Math.floor(lng / gridSize) * gridSize;
    const key = `${glat.toFixed(5)}:${glng.toFixed(5)}`;

    if (!map.has(key)) {
      map.set(key, {
        key,
        lat: glat + gridSize / 2,
        lng: glng + gridSize / 2,
        count: 0,
        done: 0,
        active: 0,
      });
    }
    const cell = map.get(key);
    cell.count += 1;
    if (r.status === "DONE") cell.done += 1;
    else if (r.status !== "REJECTED") cell.active += 1;
  }

  const arr = Array.from(map.values()).sort((a, b) => b.count - a.count);
  return arr.slice(0, 6);
}

export default function Admin({ onNavigate, lang }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [filterCat, setFilterCat] = useState("Все");
  const [filterStatus, setFilterStatus] = useState("Все");

  // карта/аналитика
  const [mapMode, setMapMode] = useState("heatmap"); // markers | heatmap | zones
  const [gridSize, setGridSize] = useState(0.01); // можно менять: 0.005 - плотнее

  async function refresh() {
    setErr("");
    setLoading(true);
    try {
      const data = await listComplaints();
      setReports(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function setStatus(id, status) {
    setErr("");
    try {
      await patchComplaint(id, { status });
      await refresh();
    } catch (e) {
      setErr(e?.message || "Ошибка обновления статуса");
    }
  }

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      const catOk = filterCat === "Все" ? true : r.ui_category === filterCat;
      const stOk = filterStatus === "Все" ? true : r.status === filterStatus;
      return catOk && stOk;
    });
  }, [reports, filterCat, filterStatus]);

  const kpi = useMemo(() => {
    const total = reports.length;
    const n = (s) => reports.filter((r) => r.status === s).length;
    return { total, newCount: n("NEW"), workCount: n("IN_PROGRESS"), doneCount: n("DONE"), rejCount: n("REJECTED") };
  }, [reports]);

  const chart = useMemo(() => {
    const keys = lastNDaysKeys(7);
    const counts = Object.fromEntries(keys.map((k) => [k, 0]));
    for (const r of reports) {
      const k = dayKey(r.created_at);
      if (k in counts) counts[k] += 1;
    }
    const max = Math.max(1, ...Object.values(counts));
    return { keys, counts, max };
  }, [reports]);

  const categoryTop = useMemo(() => {
    const m = new Map();
    for (const r of reports) {
      const key = r.ui_category || "—";
      m.set(key, (m.get(key) || 0) + 1);
    }
    return Array.from(m.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [reports]);

  const hotspots = useMemo(() => {
    return buildGridHotspots(reports, gridSize);
  }, [reports, gridSize]);

  const mapSubtitle = useMemo(() => {
    if (mapMode === "markers") return "Точки обращений с попапами. Данные проекта. Без интеграций с акиматом.";
    if (mapMode === "zones") return "Зоны: DONE = очищено/решено; NEW/IN_PROGRESS = проблемно. Только данные проекта.";
    return "Heatmap активности пользователей по обращениям. Только данные проекта.";
  }, [mapMode]);

  return (
    <div className="stack">
      {/* Header + KPIs */}
      <div className="card">
        <div className="row spaceBetween">
          <div>
            <h2>{t(lang, "admin.title")}</h2>
            <p className="muted">{t(lang, "admin.subtitle")}</p>

            <div className="adminDisclaimer">
              ❌ Жалобы не отправляются напрямую в акимат. ✅ Платформа принимает, анализирует и визуализирует обращения.
            </div>
          </div>

          <button className="btn" onClick={refresh} disabled={loading}>
            {loading ? "…" : t(lang, "admin.refresh")}
          </button>
        </div>

        {err ? <div className="errorBox">{err}</div> : null}

        <div className="grid5">
          <div className="card mini"><div className="miniTitle">Всего</div><div className="miniValue">{kpi.total}</div></div>
          <div className="card mini"><div className="miniTitle">{t(lang, "status.NEW")}</div><div className="miniValue">{kpi.newCount}</div></div>
          <div className="card mini"><div className="miniTitle">{t(lang, "status.IN_PROGRESS")}</div><div className="miniValue">{kpi.workCount}</div></div>
          <div className="card mini"><div className="miniTitle">{t(lang, "status.DONE")}</div><div className="miniValue">{kpi.doneCount}</div></div>
          <div className="card mini"><div className="miniTitle">{t(lang, "status.REJECTED")}</div><div className="miniValue">{kpi.rejCount}</div></div>
        </div>
      </div>

      {/* Map + analytics */}
      <div className="card">
        <div className="row spaceBetween">
          <div>
            <div className="sectionTitle">Карта и аналитика</div>
            <div className="muted">
              Отображение активности пользователей и зон на основе обращений проекта. Без государственных интеграций.
            </div>
          </div>

          <div className="row gap">
            <div className="segmented">
              <button
                className={`segBtn ${mapMode === "markers" ? "active" : ""}`}
                onClick={() => setMapMode("markers")}
              >
                Точки
              </button>
              <button
                className={`segBtn ${mapMode === "heatmap" ? "active" : ""}`}
                onClick={() => setMapMode("heatmap")}
              >
                Heatmap
              </button>
              <button
                className={`segBtn ${mapMode === "zones" ? "active" : ""}`}
                onClick={() => setMapMode("zones")}
              >
                Зоны
              </button>
            </div>

            <select
              className="selectSmall"
              value={String(gridSize)}
              onChange={(e) => setGridSize(Number(e.target.value))}
              aria-label="Grid size"
              title="Плотность сетки heatmap"
            >
              <option value="0.02">Сетка: крупная</option>
              <option value="0.01">Сетка: средняя</option>
              <option value="0.005">Сетка: плотная</option>
            </select>
          </div>
        </div>

        <div className="split" style={{ marginTop: 12 }}>
          <div className="card" style={{ padding: 14 }}>
            <div className="sectionTitle">Топ категорий</div>
            {categoryTop.length === 0 ? (
              <div className="muted">Нет данных</div>
            ) : (
              <div className="stack">
                {categoryTop.map(([name, count]) => (
                  <div key={name} className="row spaceBetween">
                    <div className="muted">{name}</div>
                    <div className="badge">{count}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 14 }}>
            <div className="sectionTitle">Hotspots по активности</div>
            <div className="muted" style={{ marginBottom: 10 }}>
              Сетка {gridSize}° • топ зон по количеству обращений
            </div>

            {hotspots.length === 0 ? (
              <div className="muted">Нет координат у обращений</div>
            ) : (
              <div className="stack">
                {hotspots.map((h) => (
                  <div key={h.key} className="row spaceBetween">
                    <div className="muted">
                      {h.lat.toFixed(4)}, {h.lng.toFixed(4)}
                      <div style={{ fontSize: 12, opacity: 0.85 }}>
                        Очищено: {h.done} • Проблемно: {h.active}
                      </div>
                    </div>
                    <div className="badge">{h.count}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <CityMap
            complaints={reports}
            mode={mapMode}
            gridSize={gridSize}
            title="Интерактивная карта города"
            subtitle={mapSubtitle}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="sectionTitle">{t(lang, "admin.filters")}</div>
        <div className="split">
          <div>
            <label className="label">{t(lang, "admin.filter.category")}</label>
            <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
              {UI_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t(lang, "admin.filter.status")}</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              {STATUS.map((s) => (
                <option key={s} value={s}>
                  {s === "Все" ? "Все" : t(lang, `status.${s}`)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="card">
        <div className="sectionTitle">{t(lang, "admin.chart")}</div>
        <div className="chart">
          {chart.keys.map((k) => {
            const v = chart.counts[k];
            const w = Math.round((v / chart.max) * 100);
            return (
              <div key={k} className="chartRow">
                <div className="chartLabel">{k}</div>
                <div className="chartBarWrap">
                  <div className="chartBar" style={{ width: `${w}%` }} />
                </div>
                <div className="chartValue">{v}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="card">
        <div className="row spaceBetween">
          <div className="sectionTitle">{t(lang, "admin.list")} ({filtered.length})</div>
          <button className="btn" onClick={() => onNavigate("report")}>+ {t(lang, "nav.report")}</button>
        </div>

        {filtered.length === 0 ? (
          <div className="muted">{t(lang, "admin.none")}</div>
        ) : (
          <div className="stack">
            {filtered.map((r) => (
              <div key={r.id} className="card reportCard">
                <div className="reportMid">
                  <div className="row gap">
                    <span className={`badge ${r.status === "REJECTED" ? "danger" : ""}`}>
                      {t(lang, `status.${r.status}`)}
                    </span>
                    <span className="muted">{formatDate(r.created_at)}</span>
                  </div>

                  <div className="title">{r.ui_category || "—"}</div>
                  <div className="muted">{t(lang, "ai.department")}: <b>{r.department || "—"}</b></div>

                  <div className="aiLine">
                    <span className="aiTag">{t(lang, "ai.cv")}:</span>
                    <span className="muted">
                      {r.cv_label} • {Number(r.cv_score).toFixed(3)} • relevant: {r.is_relevant === "1" ? "true" : "false"}
                    </span>
                  </div>

                  <div className="aiLine">
                    <span className="aiTag">{t(lang, "ai.nlp")}:</span>
                    <span className="muted">
                      {r.nlp_category} • conf: {Number(r.nlp_confidence).toFixed(3)} • {t(lang, "ai.urgency")}: {r.nlp_urgency}
                    </span>
                  </div>

                  <div className="desc">{r.text || "—"}</div>

                  <details className="details">
                    <summary>{t(lang, "ai.explain")}</summary>
                    <pre className="explain">{r.routing_explain || ""}</pre>
                  </details>
                </div>

                <div className="reportRight">
                  <div className="btnCol">
                    <button className="btn" onClick={() => setStatus(r.id, "NEW")}>{t(lang, "status.NEW")}</button>
                    <button className="btn" onClick={() => setStatus(r.id, "IN_PROGRESS")}>{t(lang, "status.IN_PROGRESS")}</button>
                    <button className="btn primary" onClick={() => setStatus(r.id, "DONE")}>{t(lang, "status.DONE")}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
