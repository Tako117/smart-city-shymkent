// src/pages/Home.jsx
import React from "react";
import { t } from "../i18n/index.js";

export default function Home({ onNavigate, lang }) {
  return (
    <div className="stack">
      <div className="card hero">
        <h1>{t(lang, "home.title")}</h1>
        <p className="muted">{t(lang, "home.subtitle")}</p>

        <div className="actions">
          <button className="btn primary" onClick={() => onNavigate("report")}>
            {t(lang, "home.btn.report")}
          </button>
          <button className="btn" onClick={() => onNavigate("admin")}>
            {t(lang, "home.btn.admin")}
          </button>
        </div>
      </div>
    </div>
  );
}