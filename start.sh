#!/usr/bin/env bash
# CertPilot — one-shot startup for local demo
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "  ✈  CertPilot — enterprise certification readiness copilot"
echo "  ─────────────────────────────────────────────────────────"
echo ""

# Backend
echo "  [1/2] Starting CertPilot API (port 8000)…"
cd "$ROOT/backend"
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate 2>/dev/null || true
pip install -q -r requirements.txt
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

sleep 4

echo "  [2/2] Starting CertPilot UI (port 5173)…"
cd "$ROOT/frontend"
npm install --silent
npm run dev &
FRONTEND_PID=$!

sleep 3

echo ""
echo "  ──────────────────────────────────────────────────────────"
echo "  ✅  CertPilot is running"
echo ""
echo "    UI:  http://localhost:5173"
echo "    API: http://localhost:8000/docs"
echo ""
echo "  LLM mode: simulation (no keys needed)"
echo "  Set GITHUB_TOKEN in backend/.env for live GPT-4o reasoning"
echo "  ──────────────────────────────────────────────────────────"
echo ""

# Wait for Ctrl-C
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '  Stopped.'; exit" INT TERM
wait
