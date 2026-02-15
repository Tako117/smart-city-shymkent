import React from "react";
import { t, langLabel } from "../i18n/index.js";
import { Link } from "react-router-dom"; // если у тебя нет react-router-dom, убери эту строку
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
        <div className="brand" onClick={() => onNavigate("home")} style={{ cursor: "pointer" }}>
          <img
            src={logo}
            alt="Smart City Shymkent"
            className="brandLogo"
          />
          <div>
            <div className="brandTitle">Smart City Shymkent</div>
            <div className="brandSub">Unified city issues</div>
          </div>
        </div>

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

      <footer className="footer">
        MVP prototype • Smart City Shymkent
      </footer>
    </div>
  );
}
