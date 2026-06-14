import React from "react";
import { IQStrip } from "./IQBadges";

function Logo() {
  return (
    <svg width="30" height="30" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="18" stroke="#F2A93B" strokeWidth="1.5" opacity="0.5" />
      <circle cx="20" cy="20" r="13" stroke="#4CC9F0" strokeWidth="1" opacity="0.5" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <line
          key={deg}
          x1="20"
          y1="3"
          x2="20"
          y2="6"
          stroke="#8B98AA"
          strokeWidth="1"
          transform={`rotate(${deg} 20 20)`}
        />
      ))}
      <line x1="20" y1="20" x2="29" y2="13" stroke="#F2A93B" strokeWidth="2" strokeLinecap="round" />
      <circle cx="20" cy="20" r="2" fill="#F2A93B" />
    </svg>
  );
}

const TABS = [
  { id: "learner", label: "Learner Studio" },
  { id: "manager", label: "Manager Hub" },
];

export default function TopBar({ view, setView, llmMode }) {
  return (
    <header className="sticky top-0 z-20 border-b border-panel-border bg-panel-bg/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <div className="font-display text-lg font-semibold leading-none tracking-tight text-ink">
              CertPilot
            </div>
            <div className="text-[11px] leading-none text-ink-faint">
              Enterprise certification readiness copilot
            </div>
          </div>
        </div>

        <nav className="flex items-center gap-1 rounded-full border border-panel-border bg-panel-surface p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                view === tab.id
                  ? "bg-amber-glow/15 text-amber-glow shadow-glow"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <IQStrip />
          {llmMode && (
            <span className="ml-1 rounded-full border border-panel-border px-2.5 py-1 text-[11px] font-mono uppercase tracking-wide text-ink-faint">
              {llmMode === "live" ? "Foundry: live" : "Foundry: simulated"}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
