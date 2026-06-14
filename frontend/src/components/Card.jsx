import React from "react";

export default function Card({ title, icon: Icon, accent, badge, children, className = "" }) {
  return (
    <div
      className={`instrument-texture rounded-2xl border border-panel-border bg-panel-surface shadow-panel ${className}`}
    >
      {title && (
        <div className="flex items-center justify-between border-b border-panel-border px-4 py-3">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4" style={{ color: accent || "#8B98AA" }} />}
            <h3 className="font-display text-sm font-semibold tracking-wide text-ink">{title}</h3>
          </div>
          {badge}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
