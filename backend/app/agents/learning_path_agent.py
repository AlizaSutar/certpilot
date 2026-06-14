"""
Agent 1 — Learning Path Curator
Simulates: Foundry IQ grounded retrieval (cited knowledge base search)

Searches the certification knowledge base for the target certification and
the employee's role, then produces a grounded, cited learning path that
highlights skill gaps and priority topics.
"""

from app.knowledge_base import search_knowledge_base, search_certification_data, get_certifications
from app.llm_client import call_llm_json


def _fallback(employee_role: str, target_certification: str, current_skills: list, citations: list) -> dict:
    """Deterministic, data-grounded learning path used in simulation mode."""
    certs = {c["id"]: c for c in get_certifications()}
    cert = certs.get(target_certification)

    current_skills_lower = {s.lower() for s in current_skills}

    if cert:
        skill_gaps = [s for s in cert["skills"] if s.lower() not in current_skills_lower]
        estimated_hours = cert["recommended_hours"]
        cert_name = f"{cert['id']}: {cert['name']}"
        all_skills = cert["skills"]
    else:
        skill_gaps = ["Core concepts"]
        estimated_hours = 20
        cert_name = target_certification
        all_skills = skill_gaps

    coverage = 1 - (len(skill_gaps) / max(len(all_skills), 1))
    readiness_score = max(10, min(95, round(coverage * 100)))

    priorities = ["High", "Medium", "Low"]
    learning_topics = []
    for i, gap in enumerate(skill_gaps[:4]):
        learning_topics.append({
            "topic": gap,
            "priority": priorities[min(i, 2)],
            "reason": f"Identified as a skill gap for {employee_role}s pursuing {target_certification}.",
            "citation": citations[i % len(citations)] if citations else "[Source: certification_guide.md]",
        })

    if not learning_topics:
        learning_topics.append({
            "topic": "Exam-pattern practice & review",
            "priority": "Medium",
            "reason": "Skills already largely covered — focus on exam familiarity.",
            "citation": citations[0] if citations else "[Source: certification_guide.md]",
        })

    return {
        "certification": cert_name,
        "role": employee_role,
        "skill_gaps": skill_gaps or ["Exam familiarity"],
        "learning_topics": learning_topics,
        "recommended_resources": [
            "Microsoft Learn learning path",
            "Official practice assessment",
            "CertPilot study guide (Foundry IQ grounded)",
        ],
        "estimated_hours": estimated_hours,
        "readiness_score": readiness_score,
        "summary": (
            f"Based on grounded knowledge base data, {employee_role}s targeting "
            f"{target_certification} should focus on {', '.join(skill_gaps[:3]) or 'final exam review'}. "
            f"Current readiness is estimated at {readiness_score}% with ~{estimated_hours}h of study recommended."
        ),
    }


def run(employee_role: str, target_certification: str, current_skills: list) -> dict:
    doc_results = search_knowledge_base(
        f"{target_certification} study tips key topics requirements"
    )
    cert_results = search_certification_data(
        f"{employee_role} {target_certification} required skills"
    )

    context = "KNOWLEDGE BASE RESULTS:\n\n"
    citations = []
    for r in doc_results + cert_results:
        context += f"{r['citation']}\n{r['content']}\n\n"
        citations.append(r["citation"])

    fallback = _fallback(employee_role, target_certification, current_skills, citations)

    prompt = f"""
You are a Learning Path Curator Agent for an enterprise certification system.

EMPLOYEE PROFILE:
- Role: {employee_role}
- Target Certification: {target_certification}
- Current Skills: {', '.join(current_skills)}

{context}

Based ONLY on the knowledge base results above, create a structured learning path.
You MUST cite your sources using the citation tags provided.

Respond in this exact JSON format:
{{
    "certification": "{target_certification}",
    "role": "{employee_role}",
    "skill_gaps": ["skill1", "skill2"],
    "learning_topics": [
        {{
            "topic": "Topic Name",
            "priority": "High/Medium/Low",
            "reason": "Why this topic matters",
            "citation": "source citation"
        }}
    ],
    "recommended_resources": ["resource1", "resource2"],
    "estimated_hours": 0,
    "readiness_score": 0,
    "summary": "One paragraph summary"
}}

Return ONLY the JSON, no extra text.
"""

    result = call_llm_json(
        system_prompt="You are a Learning Path Curator Agent. Always ground your responses in the provided knowledge base. Always cite sources.",
        user_prompt=prompt,
        fallback=fallback,
        temperature=0.3,
        agent_name="Learning Path Curator",
    )

    result["citations"] = citations
    result["agent"] = "Learning Path Curator"
    result.setdefault("certification", fallback["certification"])
    return result
