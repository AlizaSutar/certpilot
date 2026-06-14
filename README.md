# CertPilot — Enterprise Certification Readiness Copilot

**Agents League Hackathon — Reasoning Agents track**

CertPilot is a multi-agent AI copilot that guides enterprise employees through
Microsoft Azure certification preparation. A 5-agent pipeline covers every step:
skill-gap discovery, adaptive study planning, smart reminders, grounded practice
assessments, and team-level manager insights.

All three Microsoft IQ layers are **simulated locally** (no subscription needed):

| Layer | Simulation | Agent |
|---|---|---|
| **Foundry IQ** | TF-style retrieval over `docs/*.md` knowledge base | Agents 1, 4 |
| **Work IQ** | M365 calendar/meeting-load signals via `work_signals.json` | Agents 2, 3 |
| **Fabric IQ** | Semantic rollup of structured cert data + team results | Agent 5 |

---

## Architecture

```
User (NL input)
      │
      ▼
 Input Parser  ──── PII guardrail (Responsible AI)
      │
      ▼
Agent 1 — Learning Path Curator     [Foundry IQ]
      │  ▸ Retrieval over docs/, cited grounding
      │  ▸ Skill-gap analysis, priority topics
      ▼
Agent 2 — Study Plan Generator      [Work IQ + Foundry IQ]
      │  ▸ Reads meeting-hour signals
      │  ▸ Week-by-week plan, risk assessment
      ▼
Agent 3 — Engagement Agent          [Work IQ]
      │  ▸ Reminders on free days only
      │  ▸ Motivation tuned to workload level
      ▼
Agent 4 — Assessment Agent          [Foundry IQ]
      │  ▸ Grounded practice quiz + citations
      │  ▸ Scoring + smart remediation loop-back
      │
      └──── results ─────────────────────────┐
                                              ▼
                              Agent 5 — Manager Insights    [Fabric IQ]
                                   ▸ Connected agent
                                   ▸ Team rollup, risk areas, actions
```

## Running locally

### Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs at `http://localhost:8000/docs`

### Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

Vite proxies `/api/*` to the backend automatically.

### LLM modes

CertPilot runs **without any keys** in simulation mode — every agent returns
deterministic, data-grounded JSON. To enable live GPT-4o:

```bash
# backend/.env
GITHUB_TOKEN=ghp_...           # GitHub Models (free)
# or
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_ENDPOINT=https://...
```

---

## Key features

| Feature | Detail |
|---|---|
| Natural language input | "I'm a cloud engineer targeting AZ-204…" |
| PII guardrail | Emails/phone numbers blocked before any processing |
| Foundry IQ grounding | Every topic and question cites its knowledge-base source |
| Work IQ adaptation | Study plan avoids busy days, respects peak focus windows |
| Smart remediation | Assessment re-generates only for *failed* topics, not a full restart |
| Manager Hub | Fabric IQ rollup: team readiness, at-risk employees, actions |
| Live agent trace | Animated 5-step pipeline trace visible to users (and judges) |
| Simulation mode | Fully functional offline — no Azure subscription needed |

## Project structure

```
certpilot/
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   ├── learning_path_agent.py
│   │   │   ├── study_plan_agent.py
│   │   │   ├── engagement_agent.py
│   │   │   ├── assessment_agent.py
│   │   │   └── manager_insights_agent.py
│   │   ├── data/               # Fabric IQ / Work IQ source data
│   │   ├── docs/               # Foundry IQ knowledge base
│   │   ├── knowledge_base.py   # Offline retrieval (TF-style)
│   │   ├── llm_client.py       # Live / simulation toggle
│   │   ├── input_parser.py     # NL → structured + PII guardrail
│   │   ├── orchestrator.py     # Pipeline coordinator
│   │   └── main.py             # FastAPI app
│   └── requirements.txt
└── frontend/
    └── src/
        ├── components/
        │   ├── TopBar.jsx
        │   ├── LearnerStudio.jsx   # Employee view
        │   ├── ManagerHub.jsx      # Manager view
        │   ├── AgentTrace.jsx      # Live pipeline visualizer
        │   ├── LearningPathCard.jsx
        │   ├── StudyPlanCard.jsx
        │   ├── EngagementCard.jsx
        │   ├── AssessmentCard.jsx
        │   ├── ProfileChip.jsx
        │   ├── Gauge.jsx           # Instrument-panel readiness dial
        │   ├── IQBadges.jsx
        │   ├── ChatPanel.jsx
        │   └── Card.jsx
        ├── lib/api.js
        └── App.jsx
```

## Responsible AI notes

- PII guardrail in `input_parser.py` detects and blocks emails, phone numbers,
  and ID patterns before any data reaches the agents.
- The Manager Insights Agent only receives employee IDs — never names or other PII.
- Every Learning Path topic and Assessment question includes a citation to its
  knowledge-base source (`[Source: certification_guide.md, Section N]`).
- In live LLM mode, grounding is enforced via system prompts ("Based ONLY on the
  knowledge base results above").
