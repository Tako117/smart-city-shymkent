// src/pages/Admin.jsx
import React, { useEffect, useMemo, useState } from "react";
import { t } from "../i18n/index.js";
import { listComplaints, patchComplaint } from "../libb/api.js";

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

export default function Admin({ onNavigate, lang }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [filterCat, setFilterCat] = useState("Все");
  const [filterStatus, setFilterStatus] = useState("Все");

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

  return (
    <div className="stack">
      <div className="card">
        <div className="row spaceBetween">
          <div>
            <h2>{t(lang, "admin.title")}</h2>
            <p className="muted">{t(lang, "admin.subtitle")}</p>
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
              {STATUS.map((s) => <option key={s} value={s}>{s === "Все" ? "Все" : t(lang, `status.${s}`)}</option>)}
            </select>
          </div>
        </div>
      </div>

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
                    <span className={`badge ${r.status === "REJECTED" ? "danger" : ""}`}>{t(lang, `status.${r.status}`)}</span>
                    <span className="muted">{formatDate(r.created_at)}</span>
                  </div>

                  <div className="title">{r.ui_category || "—"}</div>
                  <div className="muted">{t(lang, "ai.department")}: <b>{r.department || "—"}</b></div>

                  <div className="aiLine">
                    <span className="aiTag">{t(lang, "ai.cv")}:</span>
                    <span className="muted">{r.cv_label} • {Number(r.cv_score).toFixed(3)} • relevant: {r.is_relevant === "1" ? "true" : "false"}</span>
                  </div>

                  <div className="aiLine">
                    <span className="aiTag">{t(lang, "ai.nlp")}:</span>
                    <span className="muted">{r.nlp_category} • conf: {Number(r.nlp_confidence).toFixed(3)} • {t(lang, "ai.urgency")}: {r.nlp_urgency}</span>
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