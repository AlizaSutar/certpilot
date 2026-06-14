import React from "react";
import { BookOpen, Quote } from "lucide-react";
import Card from "./Card";
import Gauge from "./Gauge";

const PRIORITY_COLOR = {
  High: "text-risk-high border-risk-high/30 bg-risk-high/10",
  Medium: "text-amber-glow border-amber-glow/30 bg-amber-glow/10",
  Low: "text-workiq border-workiq/30 bg-workiq/10",
};

export default function LearningPathCard({ learningPath }) {
  if (!learningPath) return null;
  const { certification, skill_gaps = [], learning_topics = [], estimated_hours, readiness_score, summary, recommended_resources = [] } = learningPath;

  return (
    <Card
      title="Learning Path Curator"
      icon={BookOpen}
      accent="#4CC9F0"
      badge={<span className="font-mono text-[11px] text-foundry">Foundry IQ</span>}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Gauge value={readiness_score} label="Readiness" sublabel={`~${estimated_hours}h to go`} size={140} />
        <div className="flex-1">
          <div className="font-display text-base font-semibold text-ink">{certification}</div>
          <p className="mt-1 text-sm text-ink-muted">{summary}</p>
          {skill_gaps.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {skill_gaps.map((g) => (
                <span key={g} className="rounded-full border border-foundry/30 bg-foundry/10 px-2.5 py-1 text-[11px] text-foundry">
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {learning_topics.length > 0 && (
        <div className="mt-4 space-y-2">
          {learning_topics.map((t, i) => (
            <div key={i} className="rounded-xl border border-panel-border bg-panel-raised p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-ink">{t.topic}</span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase ${PRIORITY_COLOR[t.priority] || PRIORITY_COLOR.Medium}`}>
                  {t.priority}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-muted">{t.reason}</p>
              {t.citation && (
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-foundry/80">
                  <Quote className="h-3 w-3" />
                  <span className="font-mono">{t.citation}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {recommended_resources.length > 0 && (
        <div className="mt-4 text-xs text-ink-faint">
          <span className="font-medium text-ink-muted">Recommended: </span>
          {recommended_resources.join(" · ")}
        </div>
      )}
    </Card>
  );
}
