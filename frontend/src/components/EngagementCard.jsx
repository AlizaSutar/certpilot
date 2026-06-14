import React from "react";
import { Bell, Sparkles } from "lucide-react";
import Card from "./Card";

export default function EngagementCard({ engagement }) {
  if (!engagement) return null;
  const { workload_level, engagement_style, reminders = [], weekly_checkins = [], motivation_messages = [] } = engagement;

  return (
    <Card
      title="Engagement Agent"
      icon={Bell}
      accent="#3DDC97"
      badge={<span className="font-mono text-[11px] text-workiq">Work IQ</span>}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full border border-panel-border bg-panel-raised px-2.5 py-1 text-ink-muted">
          Workload: <span className="text-ink">{workload_level}</span>
        </span>
        <span className="text-ink-faint">{engagement_style}</span>
      </div>

      {reminders.length > 0 && (
        <div className="mt-3 space-y-2">
          {reminders.map((r, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-panel-border bg-panel-raised px-3 py-2 text-xs">
              <div className="text-ink">{r.message}</div>
              <div className="shrink-0 pl-3 text-right font-mono text-ink-faint">
                {r.day} · {r.time}
                {r.channel && <div className="text-[10px]">{r.channel}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {weekly_checkins.length > 0 && (
        <div className="mt-3">
          <div className="mb-1.5 text-[11px] uppercase tracking-wide text-ink-faint">Weekly check-ins</div>
          <div className="space-y-1.5">
            {weekly_checkins.map((c, i) => (
              <div key={i} className="text-xs text-ink-muted">
                <span className="font-mono text-ink-faint">Wk{c.week} · {c.checkin_day} {c.checkin_time}</span> — {c.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {motivation_messages.length > 0 && (
        <div className="mt-3 rounded-lg border border-amber-glow/20 bg-amber-glow/5 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-amber-glow">
            <Sparkles className="h-3 w-3" /> Motivation
          </div>
          <ul className="space-y-1 text-xs text-ink-muted">
            {motivation_messages.map((m, i) => (
              <li key={i}>“{m}”</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
