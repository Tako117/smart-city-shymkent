// src/pages/Report.jsx
import React, { useMemo, useState } from "react";
import { t } from "../i18n/index.js";
import { createComplaint } from "../libb/api.js";

// Категории UI (то, что выбирает пользователь)
const UI_CATEGORIES = [
  "Переполненные мусорные контейнеры",
  "Стихийные свалки",
  "Мусор во дворах и вдоль дорог",
  "Сломанные детские площадки",
  "Плохое/отсутствующее уличное освещение",
  "Ямы, повреждённые тротуары",
  "Другое (свободное описание)",
];

function statusKey(status) {
  return `status.${status || "NEW"}`;
}

export default function Report({ onNavigate, lang }) {
  const [file, setFile] = useState(null);
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [category, setCategory] = useState(UI_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [addressHint, setAddressHint] = useState("");

  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");

  const [sending, setSending] = useState(false);
  const [created, setCreated] = useState(null);
  const [error, setError] = useState("");

  const coordsText = useMemo(() => {
    if (typeof lat === "number" && typeof lng === "number") {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
    return "";
  }, [lat, lng]);

  function onPickFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    const reader = new FileReader();
    reader.onload = () => setPhotoDataUrl(String(reader.result || ""));
    reader.readAsDataURL(f);
  }

  function getGeo() {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      },
      () => alert("Не удалось получить геолокацию. Используйте ручной ввод.")
    );
  }

  function applyManualGeo() {
    const a = Number(manualLat);
    const b = Number(manualLng);
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      alert("Введите корректные координаты (числа).");
      return;
    }
    setLat(a);
    setLng(b);
  }

  async function submit() {
    setError("");
    if (!file) {
      alert("Загрузите фотографию.");
      return;
    }
    if (!description.trim()) {
      // NLP обязателен для качества
      alert("Введите описание (это нужно для AI анализа текста).");
      return;
    }

    setSending(true);
    try {
      const res = await createComplaint({
        file,
        text: `${description}\n${addressHint ? "Address: " + addressHint : ""}`.trim(),
        uiCategory: category,
        lat: typeof lat === "number" ? String(lat) : "",
        lng: typeof lng === "number" ? String(lng) : "",
        lang,
      });
      setCreated(res);
    } catch (e) {
      setError(e?.message || "Ошибка отправки");
    } finally {
      setSending(false);
    }
  }

  if (created) {
    return (
      <div className="stack">
        <div className="card">
          <h2>{t(lang, "report.sent.title")}</h2>
          <p className="muted">
            {t(lang, "report.sent.status")}: <b>{t(lang, statusKey(created.status))}</b>
          </p>
          <p className="muted">
            {t(lang, "report.sent.id")}: <b>{created.id}</b>
          </p>

          <div className="divider" />

          <div className="aiBlock">
            <div className="aiTitle">{t(lang, "ai.cv")}</div>
            <div className="muted">{created.cv_label} • score: {created.cv_score?.toFixed?.(3) ?? created.cv_score}</div>
            <div className="muted">
              relevant: <b>{created.is_relevant === "1" ? "true" : "false"}</b>
            </div>
          </div>

          <div className="aiBlock">
            <div className="aiTitle">{t(lang, "ai.nlp")}</div>
            <div className="muted">
              category: <b>{created.nlp_category}</b> • conf: {created.nlp_confidence?.toFixed?.(3) ?? created.nlp_confidence}
            </div>
            <div className="muted">
              {t(lang, "ai.urgency")}: <b>{created.nlp_urgency}</b>
            </div>
          </div>

          <div className="aiBlock">
            <div className="aiTitle">{t(lang, "ai.department")}</div>
            <div><b>{created.department}</b></div>
          </div>

          <div className="aiBlock">
            <div className="aiTitle">{t(lang, "ai.explain")}</div>
            <pre className="explain">{created.routing_explain}</pre>
          </div>

          <div className="actions">
            <button className="btn primary" onClick={() => onNavigate("admin")}>
              {t(lang, "report.sent.toAdmin")}
            </button>
            <button className="btn" onClick={() => onNavigate("home")}>
              {t(lang, "report.sent.home")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="card">
        <h2>{t(lang, "report.title")}</h2>
        <p className="muted">{t(lang, "report.subtitle")}</p>
        {error ? <div className="errorBox">{error}</div> : null}
      </div>

      <div className="card">
        <div className="sectionTitle">{t(lang, "report.step1")}</div>
        <label className="label">{t(lang, "report.photo.pick")}</label>
        <input type="file" accept="image/*" onChange={onPickFile} />
        <div className="preview">
          {photoDataUrl ? <img src={photoDataUrl} alt="preview" /> : <div className="previewEmpty">{t(lang, "report.preview.empty")}</div>}
        </div>
      </div>

      <div className="card">
        <div className="sectionTitle">{t(lang, "report.step2")}</div>

        <label className="label">{t(lang, "report.category")}</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {UI_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <label className="label">{t(lang, "report.desc")}</label>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Например: рядом со школой большая яма, опасно для детей…"
        />

        <label className="label">{t(lang, "report.hint")}</label>
        <input
          value={addressHint}
          onChange={(e) => setAddressHint(e.target.value)}
          placeholder="Например: Нурсат, дом 12, двор"
        />
      </div>

      <div className="card">
        <div className="sectionTitle">{t(lang, "report.step3")}</div>

        <div className="row gap">
          <button className="btn" onClick={getGeo}>{t(lang, "report.geo.auto")}</button>
          <div className="muted">
            {coordsText ? <>GPS: <b>{coordsText}</b></> : "GPS: —"}
          </div>
        </div>

        <div className="split">
          <div>
            <label className="label">Lat</label>
            <input value={manualLat} onChange={(e) => setManualLat(e.target.value)} placeholder="42.3..." />
          </div>
          <div>
            <label className="label">Lng</label>
            <input value={manualLng} onChange={(e) => setManualLng(e.target.value)} placeholder="69.5..." />
          </div>
        </div>

        <button className="btn" onClick={applyManualGeo}>{t(lang, "report.geo.manual.apply")}</button>
      </div>

      <div className="card">
        <button className="btn primary" onClick={submit} disabled={sending}>
          {sending ? t(lang, "report.sending") : t(lang, "report.submit")}
        </button>
        <div className="muted">Backend AI выполнит: CV + NLP + routing.</div>
      </div>
    </div>
  );
}