import React, { useState } from "react";
import { api } from "../lib/api";
import ChatPanel from "./ChatPanel";
import AgentTrace from "./AgentTrace";
import Card from "./Card";
import Gauge from "./Gauge";
import { Users, AlertTriangle, ClipboardList, Gauge as GaugeIcon, Radar, Zap } from "lucide-react";

const WELCOME = {
  role: "assistant",
  content:
    "I'm CertPilot's Manager Hub. Ask about your team's certification readiness — who's at risk, how AZ-204 is tracking, or request a full team overview. I'll run the full agent pipeline for every employee and roll it up with the Manager Insights Agent via Fabric IQ.",
};

const SUGGESTIONS = [
  "Give me a full team readiness overview",
  "Who on my team is at risk of missing their certification?",
  "How is the team tracking on AZ-204?",
];

const RISK_COLOR = {
  High: "text-risk-high",
  Medium: "text-amber-glow",
  Low: "text-workiq",
  Critical: "text-risk-high",
  "On Track": "text-workiq",
  "At Risk": "text-amber-glow",
};

export default function ManagerHub() {
  const [messages, setMessages] = useState([WELCOME]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const handleSend = async (text) => {
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    setData(null);
    try {
      const res = await api.managerChat(text);
      setData(res);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.insights.executive_summary },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Something went wrong: ${e.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = () => handleSend("Give me a full team readiness overview");

  const insights = data?.insights;
  const team = data?.team_results || [];

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[380px_1fr]">
      {/* Left pane */}
      <div className="flex flex-col gap-4">
        {!data && !loading && (
          <button
            onClick={handleDemo}
            className="flex items-center justify-center gap-2 rounded-xl border border-fabric/30 bg-fabric/10 px-4 py-2.5 text-sm font-medium text-fabric transition-colors hover:bg-fabric/20"
          >
            <Zap className="h-4 w-4" />
            Quick demo (full team overview)
          </button>
        )}

        <div
          className="instrument-texture flex-1 rounded-2xl border border-panel-border bg-panel-surface shadow-panel"
          style={{ minHeight: 360 }}
        >
          <ChatPanel
            messages={messages}
            onSend={handleSend}
            loading={loading}
            placeholder="Ask about your team's readiness…"
            suggestions={SUGGESTIONS}
          />
        </div>

        {/* Agent trace — shows all 5 agents for manager flow */}
        <AgentTrace loading={loading} result={data} isManager />
      </div>

      {/* Right pane */}
      <div className="space-y-4 pb-6">
        {!insights ? (
          <EmptyState />
        ) : (
          <>
            {/* Team Readiness */}
            <Card
              title="Team Readiness"
              icon={GaugeIcon}
              accent="#B58CFF"
              badge={<span className="font-mono text-[11px] text-fabric">Fabric IQ</span>}
            >
              <div className="flex flex-wrap items-center justify-around gap-6">
                <Gauge value={insights.readiness_score} label="Readiness" size={150} />
                <Gauge value={insights.pass_rate} label="Pass rate" size={150} />
                <div className="grid grid-cols-2 gap-3 text-center">
                  <StatBox label="Team size" value={insights.team_size} />
                  <StatBox label="Avg score" value={`${insights.avg_score}%`} />
                  <StatBox label="At risk" value={insights.at_risk_count} accent="#FB6B6B" />
                  <StatBox
                    label="Status"
                    value={insights.overall_status}
                    accent={RISK_COLOR[insights.overall_status] ? undefined : "#F2A93B"}
                    className={RISK_COLOR[insights.overall_status]}
                  />
                </div>
              </div>
              <p className="mt-4 text-sm text-ink-muted">{insights.executive_summary}</p>
            </Card>

            {/* Cert breakdown */}
            {insights.cert_breakdown && Object.keys(insights.cert_breakdown).length > 0 && (
              <Card title="Certification Breakdown" accent="#B58CFF">
                <div className="flex flex-wrap gap-4">
                  {Object.entries(insights.cert_breakdown).map(([cert, b]) => {
                    const pct = b.total ? Math.round((b.passed / b.total) * 100) : 0;
                    return (
                      <div key={cert} className="flex flex-col items-center gap-1">
                        <Gauge value={pct} label={cert} size={100} sublabel={`${b.passed}/${b.total} passed`} />
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Risk Areas */}
            {insights.risk_areas?.length > 0 && (
              <Card title="Risk Areas" icon={AlertTriangle} accent="#FB6B6B">
                <div className="space-y-2">
                  {insights.risk_areas.map((r, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-panel-border bg-panel-raised p-3 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-ink">{r.area}</span>
                        <span
                          className={`font-mono text-[11px] uppercase ${RISK_COLOR[r.severity] || "text-ink-muted"}`}
                        >
                          {r.severity} · {r.affected_count}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-ink-muted">{r.recommendation}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Manager Actions */}
            <Card title="Manager Actions" icon={ClipboardList} accent="#F2A93B">
              <div className="space-y-2">
                {insights.manager_actions?.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-panel-border bg-panel-raised p-3 text-sm"
                  >
                    <span
                      className={`mt-0.5 rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase border-current ${RISK_COLOR[a.priority] || "text-ink-muted"}`}
                    >
                      {a.priority}
                    </span>
                    <div>
                      <div className="text-ink">{a.action}</div>
                      <div className="text-xs text-ink-faint">
                        {a.timeline} · {a.expected_impact}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {insights.team_strengths?.length > 0 && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="mb-1.5 text-[11px] uppercase tracking-wide text-workiq">
                      Strengths
                    </div>
                    <ul className="list-disc space-y-1 pl-4 text-xs text-ink-muted">
                      {insights.team_strengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="mb-1.5 text-[11px] uppercase tracking-wide text-amber-glow">
                      Improvement areas
                    </div>
                    <ul className="list-disc space-y-1 pl-4 text-xs text-ink-muted">
                      {insights.improvement_areas?.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </Card>

            {/* Team Roster */}
            <Card
              title="Team Roster"
              icon={Users}
              accent="#4CC9F0"
              badge={
                <span className="font-mono text-[11px] text-foundry">
                  Foundry IQ + Work IQ
                </span>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wide text-ink-faint">
                      <th className="pb-2 pr-4">Employee</th>
                      <th className="pb-2 pr-4">Certification</th>
                      <th className="pb-2 pr-4">Readiness</th>
                      <th className="pb-2 pr-4">Risk (Work IQ)</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-panel-border">
                    {team.map((r) => (
                      <tr key={r.employee_id}>
                        <td className="py-2.5 pr-4 font-mono text-[13px] text-ink">
                          {r.employee_id}
                        </td>
                        <td className="py-2.5 pr-4 text-ink-muted">{r.certification}</td>
                        <td className="py-2.5 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-panel-border">
                              <div
                                className="h-full rounded-full bg-foundry/70"
                                style={{ width: `${r.readiness_score || 0}%` }}
                              />
                            </div>
                            <span className="font-mono text-[12px] text-ink-muted">
                              {r.readiness_score || 0}%
                            </span>
                          </div>
                        </td>
                        <td className={`py-2.5 pr-4 font-mono text-[12px] ${RISK_COLOR[r.risk_level] || "text-ink-muted"}`}>
                          {r.risk_level}
                        </td>
                        <td className="py-2.5 text-[12px] text-ink-muted">
                          {r.passed === null || r.passed === undefined
                            ? "Pending"
                            : r.passed
                            ? "✓ Passed"
                            : "Needs remediation"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, accent, className }) {
  return (
    <div className="rounded-lg border border-panel-border bg-panel-raised px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-ink-faint">{label}</div>
      <div
        className={`font-display text-xl font-semibold ${className || ""}`}
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="instrument-texture flex h-full min-h-[480px] flex-col items-center justify-center rounded-2xl border border-dashed border-panel-border bg-panel-surface/60 p-10 text-center">
      <Radar className="mb-3 h-8 w-8 text-fabric/50" />
      <div className="font-display text-lg font-semibold text-ink">Radar is clear</div>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">
        Ask a question or hit the quick demo button. The Manager Insights Agent (Agent 5) will
        run the full pipeline across all 3 team members and roll up readiness, risk areas, and
        recommended actions via Fabric IQ.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3 text-[11px] font-mono uppercase tracking-wider">
        <span className="rounded-full border border-fabric/30 px-3 py-1 text-fabric/70">Connected agents</span>
        <span className="rounded-full border border-foundry/30 px-3 py-1 text-foundry/70">Foundry IQ</span>
        <span className="rounded-full border border-workiq/30 px-3 py-1 text-workiq/70">Work IQ</span>
        <span className="rounded-full border border-fabric/30 px-3 py-1 text-fabric/70">Fabric IQ</span>
      </div>
    </div>
  );
}
