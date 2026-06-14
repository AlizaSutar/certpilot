"""
CertPilot Orchestrator
=======================
Coordinates the connected-agent pipeline:

  Agent 1: Learning Path Curator   (Foundry IQ)
       v
  Agent 2: Study Plan Generator    (Work IQ + Foundry IQ)
       v
  Agent 3: Engagement Agent        (Work IQ)
       v
  Agent 4: Assessment Agent        (Foundry IQ + remediation loop-back)

  Agent 5: Manager Insights Agent  (Fabric IQ rollup across employee_flow results)
"""

from app.agents import learning_path_agent
from app.agents import study_plan_agent
from app.agents import engagement_agent
from app.agents import assessment_agent
from app.agents import manager_insights_agent
from app.knowledge_base import initialize


def run_employee_flow(employee_id, employee_role, target_certification, current_skills, answers=None):
    initialize()

    results = {"employee_id": employee_id}

    learning_path = learning_path_agent.run(
        employee_role=employee_role,
        target_certification=target_certification,
        current_skills=current_skills,
    )
    results["learning_path"] = learning_path

    study_plan = study_plan_agent.run(learning_path=learning_path, employee_id=employee_id)
    results["study_plan"] = study_plan

    engagement = engagement_agent.run(study_plan=study_plan, employee_id=employee_id)
    results["engagement"] = engagement

    assessment = assessment_agent.run(learning_path=learning_path, employee_id=employee_id, answers=answers)
    results["assessment"] = assessment

    results["score"] = assessment.get("score")
    results["passed"] = assessment.get("passed")
    results["certification"] = target_certification
    results["risk_level"] = study_plan.get("risk_level", "Medium")
    results["topic_breakdown"] = assessment.get("topic_breakdown", {})
    results["readiness_score"] = learning_path.get("readiness_score", 0)

    return results


def run_manager_flow(team_results):
    return manager_insights_agent.run(team_results=team_results)
