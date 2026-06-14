import React, { useState } from "react";
import { api } from "../lib/api";
import ChatPanel from "./ChatPanel";
import AgentTrace from "./AgentTrace";
import ProfileChip from "./ProfileChip";
import LearningPathCard from "./LearningPathCard";
import StudyPlanCard from "./StudyPlanCard";
import EngagementCard from "./EngagementCard";
import AssessmentCard from "./AssessmentCard";
import { Plane, Zap } from "lucide-react";

const WELCOME = {
  role: "assistant",
  content:
    "Hi, I'm CertPilot. Tell me your role and the certification you're targeting — your current skills and weekly meeting load — and my agents will build a grounded learning path, study plan, reminders, and a practice assessment.",
};

const SUGGESTIONS = [
  "I'm Rahul, a Cloud Engineer aiming for AZ-204. I know Python, Azure basics and networking, with ~20 meeting hours a week.",
  "I'm a DevOps engineer targeting AZ-400. I know Git, Linux, Docker and CI/CD.",
  "I'm a developer with REST API experience targeting AZ-204, I prefer evening study sessions.",
];

export default function LearnerStudio() {
  const [messages, setMessages] = useState([WELCOME]);
  const [loading, setLoading] = useState(false);
  const [flow, setFlow] = useState(null);
  const [traceData, setTraceData] = useState(null);
  const [profile, setProfile] = useState(null);

  const handleSend = async (text) => {
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    setFlow(null);
    setTraceData(null);
    try {
      const res = await api.chat(text, profile?.employee_id);

      if (res.type === "pii_warning") {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "⚠️ " + res.message },
        ]);
        return;
      }

      const p = res.parsed_profile;
      const r = res.result;
      setProfile(p);
      setFlow(r);
      setTraceData(res);

      const lp = r.learning_path;
      const score = r.assessment?.score;
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            `Mapped to ${lp.certification}. Readiness: ${lp.readiness_score}% · ~${lp.estimated_hours}h to go · risk: ${r.risk_level}.` +
            (score != null ? ` Practice score: ${score}%.` : " Practice assessment is ready in the panel."),
        },
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

  const handleQuizSubmit = async (answers) => {
    if (!profile || !flow) return;
    setLoading(true);
    try {
      const res = await api.employeeFlow({
        employee_id: profile.employee_id,
        employee_role: profile.employee_role,
        target_certification: profile.target_certification,
        current_skills: profile.current_skills,
        answers,
      });
      setFlow(res);
      const passed = res.assessment?.passed;
      const score = res.assessment?.score;
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: passed
            ? `✅ ${score}% — passed the practice assessment for ${res.certification}. Check the card for your next step.`
            : `${score}% — below threshold. I've generated a targeted remediation plan covering only the weak topics. Check the Assessment Agent card.`,
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Couldn't score that: ${e.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    const demoMsg =
      "I'm Priya, a DevOps engineer targeting AZ-400. I know Git, Linux, Docker and CI/CD. I have around 15 meeting hours a week and prefer afternoons.";
    handleSend(demoMsg);
  };

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[380px_1fr]">
      {/* Left pane — chat + trace + profile */}
      <div className="flex flex-col gap-4">
        {/* Demo shortcut */}
        {!flow && !loading && (
          <button
            onClick={handleDemo}
            className="flex items-center justify-center gap-2 rounded-xl border border-amber-glow/30 bg-amber-glow/10 px-4 py-2.5 text-sm font-medium text-amber-glow transition-colors hover:bg-amber-glow/20"
          >
            <Zap className="h-4 w-4" />
            Quick demo (Priya · DevOps · AZ-400)
          </button>
        )}

        <div className="instrument-texture flex-1 rounded-2xl border border-panel-border bg-panel-surface shadow-panel" style={{ minHeight: 360 }}>
          <ChatPanel
            messages={messages}
            onSend={handleSend}
            loading={loading}
            placeholder="Tell CertPilot about your role & goal…"
            suggestions={SUGGESTIONS}
          />
        </div>

        {/* Agent trace */}
        <AgentTrace loading={loading} result={traceData} />

        {/* Parsed profile */}
        {profile && <ProfileChip profile={profile} />}
      </div>

      {/* Right pane — agent output cards */}
      <div className="space-y-4 pb-6">
        {!flow && !loading ? (
          <EmptyState />
        ) : (
          <>
            <LearningPathCard learningPath={flow?.learning_path} />
            <StudyPlanCard studyPlan={flow?.study_plan} />
            <EngagementCard engagement={flow?.engagement} />
            <AssessmentCard
              assessment={flow?.assessment}
              onSubmit={handleQuizSubmit}
              loading={loading}
            />
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="instrument-texture flex h-full min-h-[480px] flex-col items-center justify-center rounded-2xl border border-dashed border-panel-border bg-panel-surface/60 p-10 text-center">
      <Plane className="mb-3 h-8 w-8 text-amber-glow/50" />
      <div className="font-display text-lg font-semibold text-ink">
        Flight plan not yet filed
      </div>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">
        Start a conversation or hit the quick demo button. The 5-agent pipeline — Learning Path
        Curator, Study Plan Generator, Engagement Agent, Assessment Agent — will run in one
        pass and populate this panel.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3 text-[11px] font-mono uppercase tracking-wider">
        <span className="rounded-full border border-foundry/30 px-3 py-1 text-foundry/70">Foundry IQ</span>
        <span className="rounded-full border border-workiq/30 px-3 py-1 text-workiq/70">Work IQ</span>
        <span className="rounded-full border border-fabric/30 px-3 py-1 text-fabric/70">Fabric IQ</span>
      </div>
    </div>
  );
}
