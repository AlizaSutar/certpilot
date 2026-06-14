import React, { useState, useEffect } from "react";
import TopBar from "./components/TopBar";
import LearnerStudio from "./components/LearnerStudio";
import ManagerHub from "./components/ManagerHub";
import { api } from "./lib/api";

export default function App() {
  const [view, setView] = useState("learner");
  const [llmMode, setLlmMode] = useState(null);

  useEffect(() => {
    api.health().then((h) => setLlmMode(h.llm_mode)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      <TopBar view={view} setView={setView} llmMode={llmMode} />
      {view === "learner" ? <LearnerStudio /> : <ManagerHub />}
      <footer className="mx-auto max-w-7xl px-4 py-6 text-center text-[11px] text-ink-faint sm:px-6">
        CertPilot — multi-agent certification readiness copilot · Foundry IQ, Work IQ &amp; Fabric IQ simulated for offline demo
      </footer>
    </div>
  );
}
