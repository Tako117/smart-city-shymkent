// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { t } from "../i18n/index.js";
import CityMap from "../components/CityMap.jsx";
import { listComplaints } from "../libb/api.js";

const PROBLEM_CARDS = [
  { icon: "🗑", key: "home.problems.cards.illegal_dumps" },
  { icon: "🌫", key: "home.problems.cards.air_pollution" },
  { icon: "💧", key: "home.problems.cards.water_dumping" },
  { icon: "🔥", key: "home.problems.cards.trash_burning" },
  { icon: "🌳", key: "home.problems.cards.tree_cutting" },
];

export default function Home({ onNavigate, lang }) {
  const [complaints, setComplaints] = useState([]);
  const [mapError, setMapError] = useState("");

  useEffect(() => {
    let alive = true;

    // карта использует данные проекта
    listComplaints()
      .then((data) => {
        if (!alive) return;
        if (Array.isArray(data)) setComplaints(data);
        else setComplaints([]);
      })
      .catch((e) => {
        if (!alive) return;
        setMapError(e?.message || "Failed to load map data");
        setComplaints([]);
      });

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="stack">
      {/* HERO */}
      <div className="card hero heroGrid">
        <div className="heroLeft">
          <div className="pill">{t(lang, "home.pill")}</div>
          <h1 className="heroTitle">{t(lang, "home.title")}</h1>
          <p className="heroSub muted">{t(lang, "home.subtitle")}</p>

          <div className="note">
            <div className="noteTitle">{t(lang, "home.note.title")}</div>
            <div className="noteText">
              {t(lang, "home.note.text")}
            </div>
          </div>

          <div className="actions heroActions">
            <button className="btn primary bigCta" onClick={() => onNavigate("report")}>
              {t(lang, "home.btn.report")}
              <span className="ctaArrow">→</span>
            </button>

            <button className="btn subtle" onClick={() => onNavigate("admin")}>
              {t(lang, "home.btn.admin")}
            </button>
          </div>

          <div className="heroStats">
            <div className="statChip">
              <div className="statLabel">{t(lang, "home.stats.analysis.label")}</div>
              <div className="statValue">{t(lang, "home.stats.analysis.value")}</div>
            </div>
            <div className="statChip">
              <div className="statLabel">{t(lang, "home.stats.transparency.label")}</div>
              <div className="statValue">{t(lang, "home.stats.transparency.value")}</div>
            </div>
            <div className="statChip">
              <div className="statLabel">{t(lang, "home.stats.focus.label")}</div>
              <div className="statValue">{t(lang, "home.stats.focus.value")}</div>
            </div>
          </div>
        </div>

        <div className="heroRight">
          <div className="heroVisual">
            <div className="heroVisualTitle">{t(lang, "home.visual.title")}</div>
            <div className="heroVisualText">
              {t(lang, "home.visual.text")}
            </div>

            <div className="heroVisualGrid">
              <div className="kpi">
                <div className="kpiTitle">{t(lang, "home.kpi.speed.title")}</div>
                <div className="kpiValue">{t(lang, "home.kpi.speed.value")}</div>
                <div className="kpiSub muted">{t(lang, "home.kpi.speed.sub")}</div>
              </div>
              <div className="kpi">
                <div className="kpiTitle">{t(lang, "home.kpi.quality.title")}</div>
                <div className="kpiValue">{t(lang, "home.kpi.quality.value")}</div>
                <div className="kpiSub muted">{t(lang, "home.kpi.quality.sub")}</div>
              </div>
              <div className="kpi">
                <div className="kpiTitle">{t(lang, "home.kpi.data.title")}</div>
                <div className="kpiValue">{t(lang, "home.kpi.data.value")}</div>
                <div className="kpiSub muted">{t(lang, "home.kpi.data.sub")}</div>
              </div>
              <div className="kpi">
                <div className="kpiTitle">{t(lang, "home.kpi.transparency.title")}</div>
                <div className="kpiValue">{t(lang, "home.kpi.transparency.value")}</div>
                <div className="kpiSub muted">{t(lang, "home.kpi.transparency.sub")}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 1) ПРОБЛЕМЫ */}
      <div className="card">
        <div className="sectionHead">
          <div>
            <div className="sectionTitleBig">{t(lang, "home.problems.title")}</div>
            <div className="muted">{t(lang, "home.problems.subtitle")}</div>
          </div>
        </div>

        <div className="problemGrid">
          {PROBLEM_CARDS.map((c) => (
            <div
              key={c.key}
              className="problemCard"
              onClick={() => onNavigate("report")}
              role="button"
              tabIndex={0}
            >
              <div className="problemIcon">{c.icon}</div>
              <div className="problemTitle">{t(lang, c.key)}</div>
              <div className="problemHint muted">{t(lang, "home.problems.hint")}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 2) ДЛЯ ЖЮРИ / ИНВЕСТОРОВ */}
      <div className="card">
        <div className="sectionHead">
          <div>
            <div className="sectionTitleBig">{t(lang, "home.invest.title")}</div>
            <div className="muted">{t(lang, "home.invest.subtitle")}</div>
          </div>
        </div>

        <div className="valueGrid">
          <div className="valueCard">
            <div className="valueIcon">🚀</div>
            <div className="valueTitle">{t(lang, "home.invest.cards.speed.title")}</div>
            <div className="valueText muted">
              {t(lang, "home.invest.cards.speed.text")}
            </div>
          </div>

          <div className="valueCard">
            <div className="valueIcon">🏛</div>
            <div className="valueTitle">{t(lang, "home.invest.cards.load.title")}</div>
            <div className="valueText muted">
              {t(lang, "home.invest.cards.load.text")}
            </div>
          </div>

          <div className="valueCard">
            <div className="valueIcon">🔍</div>
            <div className="valueTitle">{t(lang, "home.invest.cards.transparency.title")}</div>
            <div className="valueText muted">
              {t(lang, "home.invest.cards.transparency.text")}
            </div>
          </div>

          <div className="valueCard">
            <div className="valueIcon">📊</div>
            <div className="valueTitle">{t(lang, "home.invest.cards.opendata.title")}</div>
            <div className="valueText muted">
              {t(lang, "home.invest.cards.opendata.text")}
            </div>
          </div>
        </div>

        <div className="disclaimer">
          <b>{t(lang, "home.disclaimer.bold")}</b> {t(lang, "home.disclaimer.text")}
        </div>
      </div>

      {/* 4) КАРТА */}
      <div className="stack">
        {mapError ? (
          <div className="errorBox">
            {t(lang, "home.map.error")} <span className="muted">{mapError}</span>
          </div>
        ) : null}
        <CityMap complaints={complaints} lang={lang} />
      </div>

      {/* 7) КОНТАКТЫ */}
      <div className="card">
        <div className="sectionHead">
          <div>
            <div className="sectionTitleBig">{t(lang, "home.contacts.title")}</div>
            <div className="muted">
              {t(lang, "home.contacts.subtitle")}
            </div>
          </div>
        </div>

        <div className="contactGrid">
          <div className="contactCard">
            <div className="contactLabel muted">{t(lang, "home.contacts.email")}</div>
            <div className="contactValue">smart.shym_city@mail.ru</div>
          </div>
          <div className="contactCard">
            <div className="contactLabel muted">{t(lang, "home.contacts.phone")}</div>
            <div className="contactValue">8 705 845 80 43</div>
          </div>

          {/* ДОБАВЛЕНО ТОЛЬКО ЭТО */}
          <div className="contactCard">
            <div className="contactLabel muted">{t(lang, "home.contacts.instagram")}</div>
            <a
              href="https://www.instagram.com/smart.shym_city?igsh=d3o5MWl4bzE2cWN5"
              target="_blank"
              rel="noopener noreferrer"
              className="contactValue"
            >
              @smart.shym_city
            </a>
          </div>
          {/* КОНЕЦ ДОБАВЛЕНИЯ */}
        </div>
      </div>
    </div>
  );
}
