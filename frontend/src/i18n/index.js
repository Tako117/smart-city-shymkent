// src/i18n/index.js
import ru from "./ru.json";
import kk from "./kk.json";
import en from "./en.json";

const DICT = { ru, kk, en };

export function getDefaultLang() {
  return localStorage.getItem("lang") || "ru";
}

export function setLang(lang) {
  localStorage.setItem("lang", lang);
}

export function t(lang, key) {
  const d = DICT[lang] || DICT.ru;
  return d[key] || DICT.ru[key] || key;
}

export function langLabel(lang) {
  if (lang === "kk") return "Қазақша";
  if (lang === "en") return "English";
  return "Русский";
}