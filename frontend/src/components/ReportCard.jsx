import React from "react";
import { formatDate } from "../libb/utils.js";

export default function ReportCard({ r, onSetStatus }) {
  return (
    <div className="card reportCard">
      <div className="reportLeft">
        <div className="thumb">
          {r.photoDataUrl ? <img src={r.photoDataUrl} alt="Фото" /> : <div className="thumbEmpty">нет фото</div>}
        </div>
      </div>

      <div className="reportMid">
        <div className="row">
          <span className="badge">{r.status}</span>
          <span className="muted">{formatDate(r.createdAt)}</span>
        </div>

        <div className="title">{r.category}</div>
        <div className="muted">AI: {r.aiCategory}</div>

        <div className="desc">{r.description || "—"}</div>

        <div className="muted">
          {typeof r.lat === "number" && typeof r.lng === "number"
            ? `GPS: ${r.lat.toFixed(5)}, ${r.lng.toFixed(5)}`
            : "GPS: не указано"}
          {r.addressHint ? ` • ${r.addressHint}` : ""}
        </div>

        <div className="muted">Инстанция: {r.department}</div>
      </div>

      <div className="reportRight">
        <div className="btnCol">
          <button className="btn" onClick={() => onSetStatus(r.id, "Новая")}>Новая</button>
          <button className="btn" onClick={() => onSetStatus(r.id, "В работе")}>В работе</button>
          <button className="btn primary" onClick={() => onSetStatus(r.id, "Решена")}>Решена</button>
        </div>
      </div>
    </div>
  );
}