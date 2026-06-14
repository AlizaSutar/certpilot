import React from "react";

const IQ_STYLES = {
  foundry: { color: "#4CC9F0", label: "Foundry IQ" },
  workiq: { color: "#3DDC97", label: "Work IQ" },
  fabric: { color: "#B58CFF", label: "Fabric IQ" },
};

export function IQBadge({ kind, active = true, title }) {
  const style = IQ_STYLES[kind];
  if (!style) return null;
  return (
    <span
      title={title || `${style.label} ${active ? "connected" : "idle"}`}
      className="inline-flex items-center gap-1.5 rounded-full border border-panel-border bg-panel-raised px-2.5 py-1 text-[11px] font-mono uppercase tracking-wide text-ink-muted"
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{
          backgroundColor: active ? style.color : "rgba(255,255,255,0.2)",
          boxShadow: active ? `0 0 6px ${style.color}` : "none",
        }}
      />
      {style.label}
    </span>
  );
}

export function IQStrip({ active = ["foundry", "workiq", "fabric"] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {["foundry", "workiq", "fabric"].map((k) => (
        <IQBadge key={k} kind={k} active={active.includes(k)} />
      ))}
    </div>
  );
}
