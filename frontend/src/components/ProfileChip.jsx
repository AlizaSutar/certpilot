import React from "react";
import { User } from "lucide-react";

export default function ProfileChip({ profile }) {
  if (!profile) return null;
  const { employee_name, employee_role, target_certification, current_skills = [], meeting_hours_per_week, preferred_learning_slot } = profile;

  return (
    <div className="instrument-texture rounded-2xl border border-amber-glow/25 bg-amber-glow/5 p-4 shadow-glow">
      <div className="flex items-center gap-2 mb-3">
        <User className="h-4 w-4 text-amber-glow" />
        <span className="font-display text-sm font-semibold text-ink">Parsed Profile</span>
        <span className="font-mono text-[10px] text-ink-faint ml-auto">Input Parser · PII cleared</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <Kv label="Name" value={employee_name} />
        <Kv label="Role" value={employee_role} />
        <Kv label="Target cert" value={target_certification} accent="#4CC9F0" />
        <Kv label="Meeting hrs/wk" value={`${meeting_hours_per_week}h`} />
        <Kv label="Learning slot" value={preferred_learning_slot} />
        <div className="col-span-2">
          <div className="text-[10px] uppercase tracking-wide text-ink-faint mb-1">Current skills</div>
          <div className="flex flex-wrap gap-1">
            {current_skills.map((s) => (
              <span key={s} className="rounded-full border border-panel-border bg-panel-raised px-2 py-0.5 text-[11px] text-ink-muted">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Kv({ label, value, accent }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-ink-faint">{label}</div>
      <div className="font-mono text-[13px]" style={{ color: accent || "#E6EBF2" }}>{value}</div>
    </div>
  );
}
