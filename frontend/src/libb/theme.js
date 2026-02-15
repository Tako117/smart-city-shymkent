// src/lib/theme.js
export function getDefaultTheme() {
  return localStorage.getItem("theme") || "dark";
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("theme", theme);
}