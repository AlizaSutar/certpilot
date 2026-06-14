"""
CertPilot Backend API
=====================
FastAPI service exposing the CertPilot multi-agent certification readiness
system. Wraps the 5-agent pipeline (Learning Path Curator, Study Plan
Generator, Engagement Agent, Assessment Agent, Manager Insights Agent) and
the simulated Microsoft IQ layers (Foundry IQ, Work IQ, Fabric IQ).

Run with:
    uvicorn app.main:app --reload --port 8000
"""

from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app import orchestrator
from app.knowledge_base import initialize, get_certifications, get_learner_data, get_work_signals
from app.input_parser import parse_employee_input, parse_manager_input, check_pii
from app.llm_client import LLM_AVAILABLE

app = FastAPI(
    title="CertPilot API",
    description="Multi-agent enterprise certification readiness copilot",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup():
    initialize()


# ── Schemas ──────────────────────────────────────────────────────────────

class EmployeeFlowRequest(BaseModel):
    employee_id: str
    employee_role: str
    target_certification: str
    current_skills: List[str]
    answers: Optional[Dict[str, str]] = None


class ChatRequest(BaseModel):
    message: str
    employee_id: Optional[str] = None
    answers: Optional[Dict[str, str]] = None


class ManagerChatRequest(BaseModel):
    message: str


class ManagerFlowRequest(BaseModel):
    team_results: List[Dict[str, Any]]


# ── Health / meta ────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "product": "CertPilot",
        "llm_mode": "live" if LLM_AVAILABLE else "simulation",
        "iq_layers": ["Foundry IQ", "Work IQ", "Fabric IQ"],
    }


# ── Reference data ───────────────────────────────────────────────────────

@app.get("/api/certifications")
def list_certifications():
    return {"certifications": get_certifications()}


@app.get("/api/learners")
def list_learners():
    return {"learners": get_learner_data()}


@app.get("/api/learners/{employee_id}")
def get_learner(employee_id: str):
    learner = get_learner_data(employee_id)
    if not learner:
        raise HTTPException(status_code=404, detail="Learner not found")
    work_signal = get_work_signals(employee_id)
    return {"learner": learner, "work_signals": work_signal}


# ── Employee flow ────────────────────────────────────────────────────────

@app.post("/api/employee-flow")
def employee_flow(req: EmployeeFlowRequest):
    """Run the full 4-agent pipeline for one employee."""
    return orchestrator.run_employee_flow(
        employee_id=req.employee_id,
        employee_role=req.employee_role,
        target_certification=req.target_certification,
        current_skills=req.current_skills,
        answers=req.answers,
    )


@app.post("/api/chat")
def chat(req: ChatRequest):
    """
    Learner Studio chat endpoint.
    Parses natural language into a structured profile (with a PII guardrail),
    then runs the full agent pipeline.
    """
    pii = check_pii(req.message)
    if pii["has_pii"]:
        return {
            "type": "pii_warning",
            "message": (
                "I can't process that message because it looks like it contains personal "
                "information (" + ", ".join(pii["issues"]) + "). "
                "Please rephrase without emails, phone numbers, or ID numbers."
            ),
            "issues": pii["issues"],
        }

    parsed = parse_employee_input(req.message)
    if "error" in parsed:
        return {"type": "pii_warning", "message": "PII detected in your message.", "issues": parsed.get("issues", [])}

    employee_id = req.employee_id or parsed["employee_id"]

    flow = orchestrator.run_employee_flow(
        employee_id=employee_id,
        employee_role=parsed["employee_role"],
        target_certification=parsed["target_certification"],
        current_skills=parsed["current_skills"],
        answers=req.answers,
    )

    return {
        "type": "employee_flow",
        "parsed_profile": parsed,
        "result": flow,
    }


# ── Manager flow ─────────────────────────────────────────────────────────

@app.post("/api/manager-flow")
def manager_flow(req: ManagerFlowRequest):
    """Run the Manager Insights Agent over a set of employee flow results."""
    return orchestrator.run_manager_flow(team_results=req.team_results)


@app.post("/api/manager-chat")
def manager_chat(req: ManagerChatRequest):
    """
    Manager Hub chat endpoint. Parses the manager's query, runs the full
    pipeline for every employee in the synthetic team, then produces
    Manager Insights Agent output (Fabric IQ rollup).
    """
    parsed_query = parse_manager_input(req.message)

    learners = get_learner_data()
    team_results = []
    for learner in learners:
        flow = orchestrator.run_employee_flow(
            employee_id=learner["id"],
            employee_role=learner["role"],
            target_certification=learner["target_certification"],
            current_skills=learner["current_skills"],
            answers=None,
        )
        team_results.append(flow)

    insights = orchestrator.run_manager_flow(team_results=team_results)

    return {
        "type": "manager_insights",
        "parsed_query": parsed_query,
        "team_results": team_results,
        "insights": insights,
    }


@app.post("/api/demo/full")
def full_demo():
    """Run the full 3-employee demo + manager insights in one call (for showcase mode)."""
    learners = get_learner_data()
    team_results = []
    for learner in learners:
        flow = orchestrator.run_employee_flow(
            employee_id=learner["id"],
            employee_role=learner["role"],
            target_certification=learner["target_certification"],
            current_skills=learner["current_skills"],
            answers=None,
        )
        team_results.append(flow)

    insights = orchestrator.run_manager_flow(team_results=team_results)
    return {"employees": team_results, "manager": insights}
