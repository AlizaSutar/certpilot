import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const STEPS = [
  {
    id: "parser",
    label: "Input Parser",
    desc: "NL → structured profile · PII guardrail",
    iq: null,
    color: "#8B98AA",
  },
  {
    id: "learning_path",
    label: "Agent 1 — Learning Path Curator",
    desc: "Foundry IQ retrieval · skill-gap analysis · citations",
    iq: "FOUNDRY IQ",
    iqColor: "#4CC9F0",
    color: "#4CC9F0",
  },
  {
    id: "study_plan",
    label: "Agent 2 — Study Plan Generator",
    desc: "Work IQ calendar signals · week-by-week plan",
    iq: "WORK IQ",
    iqColor: "#3DDC97",
    color: "#3DDC97",
  },
  {
    id: "engagement",
    label: "Agent 3 — Engagement Agent",
    desc: "Smart reminders · workload-adaptive cadence",
    iq: "WORK IQ",
    iqColor: "#3DDC97",
    color: "#3DDC97",
  },
  {
    id: "assessment",
    label: "Agent 4 — Assessment Agent",
    desc: "Grounded quiz · scoring · remediation loop-back",
    iq: "FOUNDRY IQ",
    iqColor: "#4CC9F0",
    color: "#4CC9F0",
  },
];

const MANAGER_STEPS = [
  ...STEPS,
  {
    id: "manager",
    label: "Agent 5 — Manager Insights",
    desc: "Fabric IQ rollup · connected agent · team risk surfacing",
    iq: "FABRIC IQ",
    iqColor: "#B58CFF",
    color: "#B58CFF",
  },
];

function Step({ step, status, output, idx }) {
  const [open, setOpen] = useState(false);
  const dot =
    status === "done"
      ? "bg-workiq shadow-[0_0_6px_#3DDC97]"
      : status === "running"
      ? "bg-amber-glow animate-pulse shadow-[0_0_8px_#F2A93B]"
      : "bg-panel-border";

  return (
    <div className="group">
      <div className="flex items-center gap-3">
        {/* connector line */}
        <div className="flex flex-col items-center">
          <div className={`h-3 w-3 rounded-full transition-all duration-500 ${dot}`} />
          {idx < STEPS.length && (
            <div
              className="w-px flex-1 transition-colors duration-700"
              style={{
                background:
                  status === "done"
                    ? `${step.color}40`
                    : "rgba(255,255,255,0.06)",
                minHeight: "24px",
              }}
            />
          )}
        </div>

        <div className="flex-1 pb-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span
                className="text-[13px] font-medium"
                style={{ color: status === "idle" ? "#5C6878" : "#E6EBF2" }}
              >
                {step.label}
              </span>
              {step.iq && (
                <span
                  className="ml-2 font-mono text-[10px] uppercase tracking-wider"
                  style={{ color: step.iqColor, opacity: status === "idle" ? 0.4 : 1 }}
                >
                  {step.iq}
                </span>
              )}
            </div>
            {output && (
              <button
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] text-ink-faint hover:text-ink"
              >
                {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {open ? "hide" : "output"}
              </button>
            )}
          </div>
          <div
            className="text-[12px]"
            style={{ color: status === "idle" ? "#3A4455" : "#8B98AA" }}
          >
            {step.desc}
          </div>
          {status === "running" && (
            <div className="mt-1 flex gap-1">
              {[0, 0.2, 0.4].map((d) => (
                <div
                  key={d}
                  className="h-1 w-1 rounded-full bg-amber-glow"
                  style={{ animation: `pulse 1s ${d}s ease-in-out infinite` }}
                />
              ))}
            </div>
          )}
          {open && output && (
            <pre className="mt-2 max-h-48 overflow-auto rounded-lg border border-panel-border bg-panel-bg p-2 font-mono text-[11px] text-ink-muted">
              {JSON.stringify(output, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Shows a live-updating pipeline trace as the multi-agent flow runs.
 * `result` is the full flow result once done.
 * `isManager` adds the Agent 5 step.
 */
export default function AgentTrace({ loading, result, isManager = false }) {
  const steps = isManager ? MANAGER_STEPS : STEPS;
  const [expanded, setExpanded] = useState(true);
  const [activeIdx, setActiveIdx] = useState(-1);
  const intervalRef = useRef(null);

  // Animate steps while loading
  useEffect(() => {
    if (loading) {
      setActiveIdx(0);
      setExpanded(true);
      intervalRef.current = setInterval(() => {
        setActiveIdx((prev) => {
          if (prev >= steps.length - 1) {
            clearInterval(intervalRef.current);
            return prev;
          }
          return prev + 1;
        });
      }, 900);
    } else {
      clearInterval(intervalRef.current);
      if (result) setActiveIdx(steps.length); // all done
    }
    return () => clearInterval(intervalRef.current);
  }, [loading, result]);

  const getStatus = (idx) => {
    if (!loading && !result) return "idle";
    if (idx < activeIdx) return "done";
    if (idx === activeIdx && loading) return "running";
    if (!loading && result) return "done";
    return "idle";
  };

  const getOutput = (step) => {
    if (!result) return null;
    const map = {
      parser: result.parsed_profile || null,
      learning_path: result.learning_path || result.result?.learning_path || null,
      study_plan: result.study_plan || result.result?.study_plan || null,
      engagement: result.engagement || result.result?.engagement || null,
      assessment: result.assessment || result.result?.assessment || null,
      manager: result.insights || result.manager || null,
    };
    return map[step.id] || null;
  };

  return (
    <div className="instrument-texture rounded-2xl border border-panel-border bg-panel-surface shadow-panel">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between border-b border-panel-border px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-semibold text-ink">
            Agent Pipeline Trace
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
            {steps.length} agents
          </span>
        </div>
        <div className="flex items-center gap-2">
          {loading && (
            <span className="font-mono text-[11px] text-amber-glow animate-pulse">
              running…
            </span>
          )}
          {!loading && result && (
            <span className="font-mono text-[11px] text-workiq">
              ✓ complete
            </span>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-ink-faint" />
          ) : (
            <ChevronDown className="h-4 w-4 text-ink-faint" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pt-4">
          {steps.map((step, idx) => (
            <Step
              key={step.id}
              step={step}
              idx={idx}
              status={getStatus(idx)}
              output={getOutput(step)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
