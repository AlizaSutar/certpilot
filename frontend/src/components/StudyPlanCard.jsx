import React from "react";
import { CalendarClock, AlertTriangle } from "lucide-react";
import Card from "./Card";

const RISK_STYLES = {
  High: "border-risk-high/30 bg-risk-high/10 text-risk-high",
  Medium: "border-amber-glow/30 bg-amber-glow/10 text-amber-glow",
  Low: "border-workiq/30 bg-workiq/10 text-workiq",
};

export default function StudyPlanCard({ studyPlan }) {
  if (!studyPlan) return null;
  const { total_weeks, study_hours_per_week, preferred_slot, peak_focus_time, busy_days = [], weekly_plan = [], risk_level, risk_reason, summary } = studyPlan;

  return (
    <Card
      title="Study Plan Generator"
      icon={CalendarClock}
      accent="#3DDC97"
      badge={<span className="font-mono text-[11px] text-workiq">Work IQ</span>}
    >
      <div className="flex flex-wrap gap-3 text-sm">
        <Stat label="Duration" value={`${total_weeks} wk${total_weeks === 1 ? "" : "s"}`} />
        <Stat label="Hrs / week" value={`${study_hours_per_week}h`} />
        <Stat label="Slot" value={preferred_slot} />
        <Stat label="Peak focus" value={peak_focus_time} />
        <Stat label="Busy days" value={busy_days.join(", ") || "—"} />
      </div>

      {risk_level && (
        <div className={`mt-3 flex items-start gap-2 rounded-xl border px-3 py-2 text-xs ${RISK_STYLES[risk_level] || RISK_STYLES.Medium}`}>
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <div>
            <span className="font-semibold uppercase tracking-wide">{risk_level} risk</span> — {risk_reason}
          </div>
        </div>
      )}

      <p className="mt-3 text-sm text-ink-muted">{summary}</p>

      {weekly_plan.length > 0 && (
        <div className="mt-4">
          <div className="relative ml-3 space-y-4 border-l border-panel-border pl-5">
            {weekly_plan.map((w) => (
              <div key={w.week} className="relative">
                <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-panel-bg bg-workiq" />
                <div className="font-medium text-ink">
                  Week {w.week}: <span className="text-workiq">{w.focus}</span>
                </div>
                <div className="text-xs text-ink-muted">{w.daily_sessions}</div>
                {w.goals && w.goals.length > 0 && (
                  <ul className="mt-1 list-disc pl-4 text-xs text-ink-faint">
                    {w.goals.map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                )}
                <div className="mt-1 text-xs text-amber-glow">🎯 {w.milestone}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-panel-border bg-panel-raised px-3 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-ink-faint">{label}</div>
      <div className="font-mono text-sm text-ink">{value}</div>
    </div>
  );
}
