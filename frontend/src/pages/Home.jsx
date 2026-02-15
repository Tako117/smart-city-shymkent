// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { t } from "../i18n/index.js";
import CityMap from "../components/CityMap.jsx";
import { listComplaints } from "../libb/api.js";

const PROBLEM_CARDS = [
  { icon: "🗑", title: "Незаконные свалки" },
  { icon: "🌫", title: "Загрязнение воздуха" },
  { icon: "💧", title: "Сброс отходов в воду" },
  { icon: "🔥", title: "Сжигание мусора" },
  { icon: "🌳", title: "Вырубка деревьев" },
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
          <div className="pill">Smart City • MVP</div>
          <h1 className="heroTitle">{t(lang, "home.title")}</h1>
          <p className="heroSub muted">{t(lang, "home.subtitle")}</p>

          <div className="note">
            <div className="noteTitle">Важно</div>
            <div className="noteText">
              ❌ Жалобы <b>не отправляются напрямую в акимат</b>. <br />
              ✅ Платформа принимает обращения, анализирует, визуализирует и подготавливает данные для возможной будущей
              интеграции.
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
              <div className="statLabel">Анализ</div>
              <div className="statValue">AI-классификация</div>
            </div>
            <div className="statChip">
              <div className="statLabel">Прозрачность</div>
              <div className="statValue">Открытая аналитика</div>
            </div>
            <div className="statChip">
              <div className="statLabel">Фокус</div>
              <div className="statValue">Экология города</div>
            </div>
          </div>
        </div>

        <div className="heroRight">
          <div className="heroVisual">
            <div className="heroVisualTitle">Город в цифрах</div>
            <div className="heroVisualText">
              Быстрая фиксация проблем → авто-классификация → дашборд → готовые данные для решений.
            </div>

            <div className="heroVisualGrid">
              <div className="kpi">
                <div className="kpiTitle">Скорость</div>
                <div className="kpiValue">Минуты</div>
                <div className="kpiSub muted">на регистрацию</div>
              </div>
              <div className="kpi">
                <div className="kpiTitle">Качество</div>
                <div className="kpiValue">Единый формат</div>
                <div className="kpiSub muted">для анализа</div>
              </div>
              <div className="kpi">
                <div className="kpiTitle">Данные</div>
                <div className="kpiValue">Heatmap</div>
                <div className="kpiSub muted">и тренды</div>
              </div>
              <div className="kpi">
                <div className="kpiTitle">Прозрачность</div>
                <div className="kpiValue">Dashboard</div>
                <div className="kpiSub muted">для города</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 1) ПРОБЛЕМЫ */}
      <div className="card">
        <div className="sectionHead">
          <div>
            <div className="sectionTitleBig">Какие проблемы можно сообщить</div>
            <div className="muted">Выберите тип обращения — платформа поможет структурировать и визуализировать данные.</div>
          </div>
        </div>

        <div className="problemGrid">
          {PROBLEM_CARDS.map((c) => (
            <div key={c.title} className="problemCard" onClick={() => onNavigate("report")} role="button" tabIndex={0}>
              <div className="problemIcon">{c.icon}</div>
              <div className="problemTitle">{c.title}</div>
              <div className="problemHint muted">Нажмите, чтобы сообщить</div>
            </div>
          ))}
        </div>
      </div>

      {/* 2) ДЛЯ ЖЮРИ / ИНВЕСТОРОВ */}
      <div className="card">
        <div className="sectionHead">
          <div>
            <div className="sectionTitleBig">Почему это важно для города?</div>
            <div className="muted">Кратко и по делу — позиционирование как smart city стартап.</div>
          </div>
        </div>

        <div className="valueGrid">
          <div className="valueCard">
            <div className="valueIcon">🚀</div>
            <div className="valueTitle">Ускоряет обработку жалоб</div>
            <div className="valueText muted">
              Быстрая регистрация обращений с фото и геометкой. Данные сразу готовы для фильтрации и анализа.
            </div>
          </div>

          <div className="valueCard">
            <div className="valueIcon">🏛</div>
            <div className="valueTitle">Снижает нагрузку на акимат</div>
            <div className="valueText muted">
              Платформа агрегирует обращения, автоматизирует первичную классификацию и снижает ручную рутину.
            </div>
          </div>

          <div className="valueCard">
            <div className="valueIcon">🔍</div>
            <div className="valueTitle">Повышает прозрачность процессов</div>
            <div className="valueText muted">
              Публичная аналитика и статусы обращений дают прозрачную картину проблемных зон.
            </div>
          </div>

          <div className="valueCard">
            <div className="valueIcon">📊</div>
            <div className="valueTitle">Формирует открытые данные для аналитики</div>
            <div className="valueText muted">
              Heatmap и тренды позволяют видеть динамику и принимать решения на основе данных.
            </div>
          </div>
        </div>

        <div className="disclaimer">
          <b>Важно:</b> сервис не имитирует государственные интеграции. Это независимая платформа для сбора, анализа и
          визуализации обращений.
        </div>
      </div>

      {/* 4) КАРТА */}
      <div className="stack">
        {mapError ? (
          <div className="errorBox">
            Карта: не удалось загрузить данные. <span className="muted">{mapError}</span>
          </div>
        ) : null}
        <CityMap complaints={complaints} />
      </div>

      {/* 7) КОНТАКТЫ */}
      <div className="card">
        <div className="sectionHead">
          <div>
            <div className="sectionTitleBig">Связаться с нами</div>
            <div className="muted">Вопросы пользователей • обратная связь • контакты для партнёров и представителей города</div>
          </div>
        </div>

        <div className="contactGrid">
          <div className="contactCard">
            <div className="contactLabel muted">Email</div>
            <div className="contactValue">smart.shym_city@mail.ru</div>
          </div>
          <div className="contactCard">
            <div className="contactLabel muted">Телефон</div>
            <div className="contactValue">8 705 845 80 43</div>
          </div>
        </div>
      </div>
    </div>
  );
}
