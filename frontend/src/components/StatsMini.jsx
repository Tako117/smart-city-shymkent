import React from "react";

export default function StatsMini({ title, value }) {
  return (
    <div className="card mini">
      <div className="miniTitle">{title}</div>
      <div className="miniValue">{value}</div>
    </div>
  );
}