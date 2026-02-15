// src/libb/theme.js
export function getDefaultTheme() {
  const t = localStorage.getItem("theme");
  return t === "light" || t === "dark" ? t : "dark";
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("theme", theme);
}
