# CertPilot — Backend

FastAPI service powering CertPilot's multi-agent certification readiness
pipeline (Reasoning Agents track, Microsoft Foundry style architecture).

## Agents

| Agent | Role | Simulated IQ layer |
|---|---|---|
| 1. Learning Path Curator | Grounded skill-gap analysis & topic priorities | **Foundry IQ** (cited retrieval over `docs/`) |
| 2. Study Plan Generator | Week-by-week plan adapted to real calendar load | **Work IQ** (`data/work_signals.json`) |
| 3. Engagement Agent | Reminders, check-ins, motivation tuned to workload | **Work IQ** |
| 4. Assessment Agent | Practice quiz, scoring, smart remediation loop-back | **Foundry IQ** |
| 5. Manager Insights Agent | Connected agent — team rollup, risk areas, actions | **Fabric IQ** (semantic rollup) |

`app/knowledge_base.py` implements a small, fully offline retrieval index
(no model downloads) over `app/docs/*.md` (Foundry IQ) and
`app/data/certifications.json` (Fabric IQ).

## Running

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # optional
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`, with interactive docs
at `http://localhost:8000/docs`.

## LLM modes

CertPilot runs in **simulation mode** by default — every agent produces
deterministic, data-grounded JSON without calling any external API. This
keeps the whole product runnable with zero credentials (useful when you
don't have an Azure/OpenAI subscription).

To enable live GPT-4o reasoning, copy `.env.example` to `.env` and set
either:

- `GITHUB_TOKEN` (GitHub Models, free tier), or
- `AZURE_OPENAI_API_KEY` + `AZURE_OPENAI_ENDPOINT` (Microsoft Foundry / Azure OpenAI)

No code changes are required — `app/llm_client.py` automatically switches
to live mode and falls back to simulation if a call fails.

## Key endpoints

- `GET  /api/health` — status + LLM mode + IQ layers
- `GET  /api/certifications` — certification catalog (Fabric IQ source data)
- `GET  /api/learners` — synthetic learner roster
- `POST /api/chat` — Learner Studio: natural language -> full agent pipeline
- `POST /api/employee-flow` — run the pipeline with structured input (incl. quiz answers)
- `POST /api/manager-chat` — Manager Hub: runs the pipeline for the whole team + Manager Insights Agent
- `POST /api/demo/full` — one-shot full demo (3 employees + manager rollup)

## Responsible AI

- `app/input_parser.py` includes a PII guardrail (`check_pii`) that blocks
  messages containing emails, phone numbers, or ID numbers before any
  processing.
- The Manager Insights Agent only ever sees employee IDs, never names or
  other PII.
- Every Learning Path / Assessment item includes a citation back to its
  knowledge base source (`[Source: ...]`).
