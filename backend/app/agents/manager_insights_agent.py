"""
Agent 5 — Manager Insights Agent
Simulates: Fabric IQ semantic rollup of team certification readiness

A "connected agent" — consumes the outputs of Agents 1-4 across a team and
produces aggregate, privacy-preserving insights for managers (no individual
PII surfaced beyond employee IDs already used internally).
"""

from app.llm_client import call_llm_json


def _fallback(team_results, total, passed, failed, pending, pass_rate, avg_score, cert_breakdown, at_risk, avg_readiness=0):
    overall_status = "On Track"
    if pending and total and (failed / total) > 0.3:
        overall_status = "Critical"
    elif at_risk:
        overall_status = "At Risk"

    readiness_score = avg_score if avg_score else avg_readiness

    risk_areas = []
    high_load = [r for r in team_results if r.get("risk_level") == "High"]
    if high_load:
        risk_areas.append({
            "area": "Calendar overload (Work IQ)",
            "severity": "High",
            "affected_count": len(high_load),
            "recommendation": "Protect dedicated focus blocks for affected employees and rebalance meeting load.",
        })

    low_scores = [r for r in team_results if r.get("score") is not None and r["score"] < 65]
    if low_scores:
        risk_areas.append({
            "area": "Assessment scores below threshold",
            "severity": "Medium",
            "affected_count": len(low_scores),
            "recommendation": "Assign targeted remediation plans from the Assessment Agent for affected employees.",
        })

    if not risk_areas:
        risk_areas.append({
            "area": "No major risks detected",
            "severity": "Low",
            "affected_count": 0,
            "recommendation": "Continue current cadence; revisit in 2 weeks.",
        })

    return {
        "team_size": total,
        "pass_rate": pass_rate,
        "avg_score": avg_score,
        "overall_status": overall_status,
        "readiness_score": readiness_score,
        "cert_breakdown": cert_breakdown,
        "at_risk_count": len(at_risk),
        "risk_areas": risk_areas,
        "team_strengths": [
            f"{passed}/{total} employees have already passed their target certification" if passed else "Team is actively progressing through learning paths",
            "Study plans are adapted to individual calendar load via Work IQ",
        ],
        "improvement_areas": [
            "Reduce meeting load for high-risk employees",
            "Increase practice assessment frequency for at-risk certifications",
        ],
        "manager_actions": [
            {
                "priority": "High" if at_risk else "Medium",
                "action": f"Check in with {', '.join(at_risk)}" if at_risk else "Review team progress in next 1:1s",
                "timeline": "This week",
                "expected_impact": "Reduce risk of missed certification deadlines",
            }
        ],
        "executive_summary": (
            f"Team readiness is {readiness_score}% with a {pass_rate}% pass rate across {total} employees. "
            f"{len(at_risk)} employee(s) flagged at-risk due to workload or assessment performance. "
            f"Overall status: {overall_status}."
        ),
        "agent": "Manager Insights Agent",
    }


def run(team_results: list) -> dict:
    total = len(team_results)
    passed = sum(1 for r in team_results if r.get("passed") is True)
    failed = sum(1 for r in team_results if r.get("passed") is False)
    pending = sum(1 for r in team_results if r.get("passed") is None)
    pass_rate = round((passed / total) * 100) if total > 0 else 0

    scored = [r.get("score", 0) for r in team_results if r.get("score") is not None]
    avg_score = round(sum(scored) / len(scored)) if scored else 0

    readiness_vals = [r.get("readiness_score", 0) for r in team_results if r.get("readiness_score") is not None]
    avg_readiness = round(sum(readiness_vals) / len(readiness_vals)) if readiness_vals else avg_score

    cert_breakdown = {}
    for r in team_results:
        cert = r.get("certification", "Unknown")
        bucket = cert_breakdown.setdefault(cert, {"total": 0, "passed": 0})
        bucket["total"] += 1
        if r.get("passed"):
            bucket["passed"] += 1

    at_risk = [
        r["employee_id"] for r in team_results
        if r.get("risk_level") == "High" or (r.get("score") is not None and r["score"] < 65)
    ]

    fallback = _fallback(team_results, total, passed, failed, pending, pass_rate, avg_score, cert_breakdown, at_risk, avg_readiness)

    prompt = f"""
You are a Manager Insights Agent for an enterprise certification system.

TEAM STATS:
- Team size: {total}
- Passed: {passed}, Failed: {failed}, Pending: {pending}
- Pass rate: {pass_rate}%
- Average assessment score: {avg_score}%
- Certification breakdown: {cert_breakdown}
- At-risk employee IDs: {at_risk}

Produce team-level insights WITHOUT exposing personal data beyond employee IDs already provided.

Respond in this exact JSON format:
{{
    "team_size": {total},
    "pass_rate": {pass_rate},
    "avg_score": {avg_score},
    "overall_status": "On Track/At Risk/Critical",
    "readiness_score": 0,
    "cert_breakdown": {cert_breakdown},
    "at_risk_count": {len(at_risk)},
    "risk_areas": [
        {{"area": "Risk area name", "severity": "High/Medium/Low", "affected_count": 0, "recommendation": "What manager should do"}}
    ],
    "team_strengths": ["strength1", "strength2"],
    "improvement_areas": ["area1", "area2"],
    "manager_actions": [
        {{"priority": "High/Medium/Low", "action": "Specific action for manager", "timeline": "When to do it", "expected_impact": "What it will achieve"}}
    ],
    "executive_summary": "2-3 sentence executive summary for the manager"
}}

Return ONLY the JSON, no extra text.
"""

    result = call_llm_json(
        system_prompt="You are a Manager Insights Agent. Return ONLY valid JSON. Never expose PII.",
        user_prompt=prompt,
        fallback=fallback,
        temperature=0.3,
        agent_name="Manager Insights Agent",
    )
    result["agent"] = "Manager Insights Agent"
    return result
