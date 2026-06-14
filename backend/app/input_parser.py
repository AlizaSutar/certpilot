"""
Input Parser
============
- check_pii()            — Responsible AI guardrail, blocks emails/phone/ID numbers
- parse_employee_input() — natural language -> structured employee profile
- parse_manager_input()  — natural language -> structured manager query intent
"""

import re
from app.llm_client import call_llm_json

CERT_KEYWORDS = {
    "AZ-900": ["az-900", "az900", "fundamentals", "beginner"],
    "AZ-204": ["az-204", "az204", "developer"],
    "AZ-400": ["az-400", "az400", "devops"],
    "AZ-305": ["az-305", "az305", "architect", "solutions architect"],
}

ROLE_KEYWORDS = {
    "Cloud Engineer": ["cloud engineer"],
    "Developer": ["developer", "dev "],
    "DevOps Engineer": ["devops"],
    "Solutions Architect": ["architect"],
    "IT Admin": ["it admin", "administrator"],
}


def check_pii(text: str) -> dict:
    """Responsible AI guardrail: detect PII before any processing."""
    issues = []

    if re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text):
        issues.append("Email address detected")

    if re.search(r'\b\d{10}\b|\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b', text):
        issues.append("Phone number detected")

    if re.search(r'\b\d{12}\b', text):
        issues.append("Possible ID number detected")

    return {"has_pii": len(issues) > 0, "issues": issues}


def _fallback_employee(text: str) -> dict:
    lower = text.lower()

    target_certification = "AZ-204"
    for cert, kws in CERT_KEYWORDS.items():
        if any(kw in lower for kw in kws):
            target_certification = cert
            break

    employee_role = "Developer"
    for role, kws in ROLE_KEYWORDS.items():
        if any(kw in lower for kw in kws):
            employee_role = role
            break

    skills_vocab = ["python", "azure", "docker", "kubernetes", "ci/cd", "rest apis",
                    "networking", "git", "linux", "javascript", "sql", "terraform"]
    current_skills = [s.title() if s != "ci/cd" else "CI/CD" for s in skills_vocab if s in lower]
    if not current_skills:
        current_skills = ["General IT fundamentals"]

    slot = "Morning"
    if "afternoon" in lower:
        slot = "Afternoon"
    elif "evening" in lower or "night" in lower:
        slot = "Evening"

    name_match = re.search(r"\bi'?m\s+([A-Z][a-zA-Z]+)|\bi am\s+([A-Z][a-zA-Z]+)|\bmy name is\s+([A-Z][a-zA-Z]+)", text, re.IGNORECASE)
    name = "Employee"
    if name_match:
        name = (name_match.group(1) or name_match.group(2) or name_match.group(3)).capitalize()

    meeting_match = re.search(r"(\d+)\s*meeting hours", lower)
    meeting_hours = int(meeting_match.group(1)) if meeting_match else 20

    return {
        "employee_name": name,
        "employee_role": employee_role,
        "target_certification": target_certification,
        "current_skills": current_skills,
        "meeting_hours_per_week": meeting_hours,
        "focus_hours_per_week": max(0, 40 - meeting_hours - 8),
        "preferred_learning_slot": slot,
        "busy_days": ["Monday"],
        "experience_level": "Intermediate",
        "additional_context": text[:200],
        "confidence": 0.6,
    }


def parse_employee_input(natural_language_input: str) -> dict:
    pii_check = check_pii(natural_language_input)
    if pii_check["has_pii"]:
        return {"error": "PII detected", "issues": pii_check["issues"]}

    fallback = _fallback_employee(natural_language_input)

    prompt = f"""
You are an input parser for an enterprise certification learning system.
Extract structured information from the employee's natural language input.

EMPLOYEE INPUT:
"{natural_language_input}"

AVAILABLE CERTIFICATIONS:
- AZ-900: Azure Fundamentals (for beginners)
- AZ-204: Azure Developer Associate (for developers)
- AZ-400: DevOps Engineer Expert (for DevOps)
- AZ-305: Azure Solutions Architect (for architects)

AVAILABLE ROLES:
- Cloud Engineer
- Developer
- DevOps Engineer
- Solutions Architect
- IT Admin

Extract all available information. Use sensible defaults for missing info.

Respond in this exact JSON format:
{{
    "employee_name": "extracted name or 'Employee'",
    "employee_role": "closest matching role from list",
    "target_certification": "most relevant certification ID",
    "current_skills": ["skill1", "skill2"],
    "meeting_hours_per_week": 20,
    "focus_hours_per_week": 12,
    "preferred_learning_slot": "Morning/Afternoon/Evening",
    "busy_days": ["Monday"],
    "experience_level": "Beginner/Intermediate/Advanced",
    "additional_context": "any other relevant info",
    "confidence": 0.95
}}

Return ONLY the JSON, no extra text.
"""

    parsed = call_llm_json(
        system_prompt="You are an input parser. Extract structured data from natural language. Always return valid JSON.",
        user_prompt=prompt,
        fallback=fallback,
        temperature=0.1,
        agent_name="Input Parser",
    )

    name = parsed.get("employee_name", "Employee").split()[0].upper()
    parsed["employee_id"] = f"EMP-{name[:3]}-001"
    return parsed


def _fallback_manager(text: str) -> dict:
    lower = text.lower()

    query_type = "team_overview"
    if "risk" in lower:
        query_type = "at_risk"
    elif "timeline" in lower or "when" in lower:
        query_type = "completion_timeline"
    elif any(c.lower() in lower for c in CERT_KEYWORDS):
        query_type = "certification_status"

    specific_certification = None
    for cert, kws in CERT_KEYWORDS.items():
        if any(kw in lower for kw in kws):
            specific_certification = cert
            break

    return {
        "query_type": query_type,
        "specific_certification": specific_certification,
        "specific_employee": None,
        "time_period": "this month" if "month" in lower else ("this week" if "week" in lower else None),
        "focus_area": text[:200],
    }


def parse_manager_input(natural_language_input: str) -> dict:
    fallback = _fallback_manager(natural_language_input)

    prompt = f"""
You are an input parser for a manager insights system.
Extract what the manager wants to know from their query.

MANAGER QUERY:
"{natural_language_input}"

Respond in this exact JSON format:
{{
    "query_type": "team_overview/at_risk/certification_status/completion_timeline",
    "specific_certification": "AZ-204 or null",
    "specific_employee": "EMP-001 or null",
    "time_period": "this week/this month/this quarter or null",
    "focus_area": "what manager specifically wants to know"
}}

Return ONLY the JSON, no extra text.
"""

    return call_llm_json(
        system_prompt="You are an input parser for manager queries. Return ONLY valid JSON.",
        user_prompt=prompt,
        fallback=fallback,
        temperature=0.1,
        agent_name="Manager Input Parser",
    )
