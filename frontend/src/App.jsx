// src/App.jsx
import React, { useMemo, useState, useEffect } from "react";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import Report from "./pages/Report.jsx";
import Admin from "./pages/Admin.jsx";

import { getDefaultLang, setLang as persistLang } from "./i18n/index.js";
import { getDefaultTheme, applyTheme } from "./libb/theme.js";

export default function App() {
  const [route, setRoute] = useState("home"); // home | report | admin

  const [lang, setLangState] = useState(getDefaultLang());
  const [theme, setTheme] = useState(getDefaultTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function setLang(langNext) {
    setLangState(langNext);
    persistLang(langNext);
  }

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  const page = useMemo(() => {
    if (route === "report") return <Report onNavigate={setRoute} lang={lang} />;
    if (route === "admin") return <Admin onNavigate={setRoute} lang={lang} />;
    return <Home onNavigate={setRoute} lang={lang} />;
  }, [route, lang]);

  return (
    <Layout
      route={route}
      onNavigate={setRoute}
      lang={lang}
      setLang={setLang}
      theme={theme}
      toggleTheme={toggleTheme}
    >
      {page}
    </Layout>
  );
}