// src/components/Layout.jsx
import React from "react";
import { t, langLabel } from "../i18n/index.js";
import logo from "../assets/logoSHYM.png";

export default function Layout({
  route,
  onNavigate,
  children,
  lang,
  setLang,
  theme,
  toggleTheme,
}) {
  return (
    <div className="app">
      <header className="topbar">
        <button className="brand brandBtn" onClick={() => onNavigate("home")} aria-label="Go to home">
          <img className="brandLogo" src={logo} alt="Smart City Shymkent" />
          <div className="brandText">
            <div className="brandTitle">Smart City Shymkent</div>
            <div className="brandSub">Unified city issues</div>
          </div>
        </button>

        <nav className="nav">
          <button
            className={`navBtn ${route === "home" ? "active" : ""}`}
            onClick={() => onNavigate("home")}
          >
            {t(lang, "nav.home")}
          </button>
          <button
            className={`navBtn ${route === "report" ? "active" : ""}`}
            onClick={() => onNavigate("report")}
          >
            {t(lang, "nav.report")}
          </button>
          <button
            className={`navBtn ${route === "admin" ? "active" : ""}`}
            onClick={() => onNavigate("admin")}
          >
            {t(lang, "nav.admin")}
          </button>
        </nav>

        <div className="topControls">
          <select
            className="selectSmall"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            aria-label="Language"
          >
            <option value="kk">{langLabel("kk")}</option>
            <option value="ru">{langLabel("ru")}</option>
            <option value="en">{langLabel("en")}</option>
          </select>

          <button className="btnSmall" onClick={toggleTheme}>
            {theme === "dark" ? t(lang, "theme.dark") : t(lang, "theme.light")}
          </button>
        </div>
      </header>

      <main className="content">{children}</main>

      <footer className="footer footerRow">
        <div className="footerLeft">
          <img className="footerLogo" src={logo} alt="Smart City Shymkent" />
          <div>
            <div className="footerTitle">Smart City Shymkent</div>
            <div className="footerSub muted">
              MVP prototype • Платформа принимает обращения, анализирует и визуализирует данные (без интеграции с акиматом)
            </div>
          </div>
        </div>

        <div className="footerRight muted">© {new Date().getFullYear()}</div>
      </footer>
    </div>
  );
}
