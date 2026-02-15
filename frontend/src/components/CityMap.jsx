// frontend/src/components/CityMap.jsx
import React, { useMemo } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";

/**
 * modes:
 * - "markers": точечные маркеры по жалобам
 * - "heatmap": псевдо-heatmap по сетке (grid aggregation)
 * - "zones": визуальное различие зон: DONE = очищено, остальное = проблемно
 *
 * complaints: элементы из backend /complaints
 * ожидаем поля: id, lat, lng, ui_category, text, status, created_at
 */

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function statusLabel(status) {
  if (status === "DONE") return "Очищено / решено";
  if (status === "IN_PROGRESS") return "В работе";
  if (status === "NEW") return "Новое";
  if (status === "REJECTED") return "Отклонено";
  return status || "-";
}

function colorByStatus(status) {
  // Цвета: не “интеграция”, а только визуализация по данным проекта
  if (status === "DONE") return { stroke: "#20b35a", fill: "#20b35a" };
  if (status === "IN_PROGRESS") return { stroke: "#f5c542", fill: "#f5c542" };
  if (status === "REJECTED") return { stroke: "#9aa3b2", fill: "#9aa3b2" };
  // NEW и прочее
  return { stroke: "#ff6b6b", fill: "#ff6b6b" };
}

function buildGrid(complaints, gridSize = 0.01) {
  // gridSize ~ 0.01 градуса (примерно 1км)
  const cells = new Map(); // key -> { lat, lng, count, done, active, rejected, items[] }

  for (const c of complaints) {
    const lat = toNum(c.lat);
    const lng = toNum(c.lng);
    if (lat == null || lng == null) continue;

    const glat = Math.floor(lat / gridSize) * gridSize;
    const glng = Math.floor(lng / gridSize) * gridSize;
    const key = `${glat.toFixed(5)}:${glng.toFixed(5)}`;

    if (!cells.has(key)) {
      cells.set(key, {
        // центр клетки
        lat: glat + gridSize / 2,
        lng: glng + gridSize / 2,
        count: 0,
        done: 0,
        active: 0,
        rejected: 0,
        items: [],
      });
    }

    const cell = cells.get(key);
    cell.count += 1;
    if (c.status === "DONE") cell.done += 1;
    else if (c.status === "REJECTED") cell.rejected += 1;
    else cell.active += 1;

    if (cell.items.length < 6) cell.items.push(c); // чтобы попап не был огромным
  }

  const arr = Array.from(cells.values());
  const max = Math.max(1, ...arr.map((x) => x.count));
  return { cells: arr, max };
}

export default function CityMap({
  complaints = [],
  mode = "markers",
  gridSize = 0.01,
  title = "Интерактивная карта города",
  subtitle = "Визуализация строится на данных проекта. Без интеграции с акиматом.",
}) {
  // Центр Шымкента
  const center = [42.315, 69.59];

  const points = useMemo(() => {
    return complaints
      .map((c) => {
        const lat = toNum(c.lat);
        const lng = toNum(c.lng);
        if (lat == null || lng == null) return null;
        return { ...c, lat, lng };
      })
      .filter(Boolean);
  }, [complaints]);

  const grid = useMemo(() => buildGrid(points, gridSize), [points, gridSize]);

  const legend = useMemo(() => {
    if (mode === "heatmap") {
      return [
        { label: "Низкая активность", dot: "heatLow" },
        { label: "Средняя активность", dot: "heatMid" },
        { label: "Высокая активность", dot: "heatHigh" },
      ];
    }
    if (mode === "zones") {
      return [
        { label: "Очищено / решено (DONE)", dot: "zoneDone" },
        { label: "Проблемная зона (NEW/IN_PROGRESS)", dot: "zoneProblem" },
        { label: "Отклонено (REJECTED)", dot: "zoneRejected" },
      ];
    }
    return [
      { label: "Точка обращения", dot: "markerDot" },
    ];
  }, [mode]);

  return (
    <div className="card mapCard">
      <div className="mapHead">
        <div>
          <div className="sectionTitleBig">{title}</div>
          <div className="muted mapSub">{subtitle}</div>
          <div className="mapDisclaimer">
            ❌ Жалобы <b>не отправляются напрямую в акимат</b>. ✅ Платформа принимает обращения, анализирует и визуализирует.
          </div>
        </div>

        <div className="mapLegend">
          {legend.map((l) => (
            <div key={l.label} className="legendItem">
              <span className={`legendDot ${l.dot}`} />
              <span className="muted">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mapWrap">
        <MapContainer center={center} zoom={11} style={{ height: "100%", width: "100%" }}>
          <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {/* MARKERS */}
          {mode === "markers" &&
            points.map((c) => {
              const col = colorByStatus(c.status);
              return (
                <CircleMarker
                  key={c.id}
                  center={[c.lat, c.lng]}
                  radius={7}
                  pathOptions={{ color: col.stroke, fillColor: col.fill, fillOpacity: 0.75, weight: 2 }}
                >
                  <Popup>
                    <b>{c.ui_category || "Категория"}</b>
                    <div style={{ marginTop: 6 }}>{c.text || ""}</div>
                    <div style={{ marginTop: 6, opacity: 0.85 }}>Status: {statusLabel(c.status)}</div>
                    <div style={{ marginTop: 6, opacity: 0.75 }}>{formatDate(c.created_at)}</div>
                  </Popup>
                </CircleMarker>
              );
            })}

          {/* HEATMAP (grid circles) */}
          {mode === "heatmap" &&
            grid.cells.map((cell, idx) => {
              // радиус и прозрачность по count
              const ratio = cell.count / grid.max; // 0..1
              const r = clamp(Math.round(8 + ratio * 22), 8, 30);
              const op = clamp(0.25 + ratio * 0.55, 0.25, 0.8);

              return (
                <CircleMarker
                  key={`${cell.lat}:${cell.lng}:${idx}`}
                  center={[cell.lat, cell.lng]}
                  radius={r}
                  pathOptions={{
                    color: "#2ecc71",
                    fillColor: "#2ecc71",
                    fillOpacity: op,
                    weight: 1,
                  }}
                >
                  <Popup>
                    <b>Активность в зоне</b>
                    <div style={{ marginTop: 6 }}>Всего обращений: <b>{cell.count}</b></div>
                    <div style={{ marginTop: 6, opacity: 0.85 }}>
                      Очищено (DONE): {cell.done} • В работе/новые: {cell.active} • Отклонено: {cell.rejected}
                    </div>
                    {cell.items.length ? (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>Примеры:</div>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {cell.items.map((it) => (
                            <li key={it.id} style={{ marginBottom: 4 }}>
                              {it.ui_category || "—"} — <span style={{ opacity: 0.8 }}>{statusLabel(it.status)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </Popup>
                </CircleMarker>
              );
            })}

          {/* ZONES (clean vs problem) */}
          {mode === "zones" &&
            points.map((c) => {
              const col = colorByStatus(c.status);
              const isDone = c.status === "DONE";
              const radius = isDone ? 9 : 8;
              const op = isDone ? 0.65 : 0.55;

              return (
                <CircleMarker
                  key={c.id}
                  center={[c.lat, c.lng]}
                  radius={radius}
                  pathOptions={{
                    color: col.stroke,
                    fillColor: col.fill,
                    fillOpacity: op,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <b>{c.ui_category || "Категория"}</b>
                    <div style={{ marginTop: 6 }}>{c.text || ""}</div>
                    <div style={{ marginTop: 6, opacity: 0.85 }}>
                      Зона: <b>{c.status === "DONE" ? "Очищенная" : c.status === "REJECTED" ? "Отклонена" : "Проблемная"}</b>
                    </div>
                    <div style={{ marginTop: 6, opacity: 0.85 }}>Status: {statusLabel(c.status)}</div>
                    <div style={{ marginTop: 6, opacity: 0.75 }}>{formatDate(c.created_at)}</div>
                  </Popup>
                </CircleMarker>
              );
            })}
        </MapContainer>
      </div>
    </div>
  );
}
