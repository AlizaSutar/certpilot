"""
Agent 2 — Study Plan Generator
Simulates: Work IQ (calendar/meeting load signals) + Foundry IQ grounding

Builds a week-by-week study plan adapted to the employee's real meeting
load and focus time, sourced from Work IQ work signals.
"""

from app.knowledge_base import get_work_signals, search_knowledge_base
from app.llm_client import call_llm_json

DEFAULT_WORK_SIGNAL = {
    "meeting_hours_per_week": 20,
    "focus_hours_per_week": 12,
    "preferred_learning_slot": "Morning",
    "busy_days": ["Monday"],
    "peak_focus_time": "7am-9am",
}


def _fallback(learning_path: dict, employee_id: str, work_signal: dict,
               study_hours_week: float, weeks_needed: int) -> dict:
    topics = learning_path.get("learning_topics", [])
    weekly_plan = []
    for i in range(max(weeks_needed, 1)):
        topic = topics[i % len(topics)]["topic"] if topics else "Exam review"
        weekly_plan.append({
            "week": i + 1,
            "focus": topic,
            "daily_sessions": f"{round(study_hours_week / 5, 1)} hrs/day, {work_signal['preferred_learning_slot'].lower()} slot",
            "goals": [f"Review {topic}", "Complete practice questions"],
            "milestone": f"Complete Practice Quiz {i + 1}",
        })

    meeting_hours = work_signal["meeting_hours_per_week"]
    if meeting_hours > 25:
        risk_level, risk_reason = "High", f"{meeting_hours} meeting hrs/week detected via Work IQ leaves little room for study."
    elif meeting_hours > 18:
        risk_level, risk_reason = "Medium", f"{meeting_hours} meeting hrs/week is manageable but tight."
    else:
        risk_level, risk_reason = "Low", f"Only {meeting_hours} meeting hrs/week — plenty of focus time available."

    return {
        "employee_id": employee_id,
        "certification": learning_path["certification"],
        "total_weeks": weeks_needed,
        "study_hours_per_week": round(study_hours_week, 1),
        "preferred_slot": work_signal["preferred_learning_slot"],
        "peak_focus_time": work_signal.get("peak_focus_time", "Morning"),
        "busy_days": work_signal.get("busy_days", []),
        "weekly_plan": weekly_plan,
        "reminders": [
            {"day": "Tuesday", "time": "7:00 AM", "message": f"Study session: {weekly_plan[0]['focus'] if weekly_plan else 'review'}"},
        ],
        "risk_level": risk_level,
        "risk_reason": risk_reason,
        "summary": (
            f"A {weeks_needed}-week plan at {round(study_hours_week, 1)} hrs/week, scheduled around "
            f"{work_signal['meeting_hours_per_week']} meeting hrs/week (Work IQ). "
            f"Sessions are placed in the {work_signal['preferred_learning_slot'].lower()} "
            f"({work_signal.get('peak_focus_time', 'morning')}), avoiding {', '.join(work_signal.get('busy_days', [])) or 'no specific days'}."
        ),
    }


def run(learning_path: dict, employee_id: str) -> dict:
    work_signal = get_work_signals(employee_id) or DEFAULT_WORK_SIGNAL

    insights = search_knowledge_base("study hours pass rate recommendations workload")
    context = "STUDY INSIGHTS FROM KNOWLEDGE BASE:\n\n"
    for r in insights:
        context += f"{r['citation']}\n{r['content']}\n\n"

    total_work_hours = 40
    available_hours = total_work_hours - work_signal["meeting_hours_per_week"]
    study_hours_week = min(available_hours * 0.3, 10)
    study_hours_week = max(study_hours_week, 2)
    estimated_hours = learning_path.get("estimated_hours", 20)
    weeks_needed = max(1, round(estimated_hours / study_hours_week))

    fallback = _fallback(learning_path, employee_id, work_signal, study_hours_week, weeks_needed)

    topics = learning_path.get("learning_topics", [])
    topics_text = "\n".join([f"- [{t['priority']}] {t['topic']}: {t['reason']}" for t in topics])

    prompt = f"""
You are a Study Plan Generator Agent for an enterprise certification system.

EMPLOYEE WORK CONTEXT (Work IQ):
- Meeting hours per week: {work_signal['meeting_hours_per_week']}
- Focus hours per week: {work_signal['focus_hours_per_week']}
- Preferred learning slot: {work_signal['preferred_learning_slot']}
- Busy days: {', '.join(work_signal.get('busy_days', []))}
- Peak focus time: {work_signal.get('peak_focus_time', 'Morning')}
- Available study hours per week: {study_hours_week}
- Total weeks needed: {weeks_needed}

LEARNING TOPICS TO COVER:
{topics_text}

{context}

Create a practical week-by-week study plan.
Respond in this exact JSON format:
{{
    "employee_id": "{employee_id}",
    "certification": "{learning_path['certification']}",
    "total_weeks": {weeks_needed},
    "study_hours_per_week": {study_hours_week},
    "preferred_slot": "{work_signal['preferred_learning_slot']}",
    "peak_focus_time": "{work_signal.get('peak_focus_time', 'Morning')}",
    "busy_days": {work_signal.get('busy_days', [])},
    "weekly_plan": [
        {{"week": 1, "focus": "Topic name", "daily_sessions": "e.g. 1.5 hrs every Tuesday/Thursday morning", "goals": ["goal1", "goal2"], "milestone": "What to achieve by end of week"}}
    ],
    "reminders": [
        {{"day": "Tuesday", "time": "7:00 AM", "message": "Reminder message"}}
    ],
    "risk_level": "Low/Medium/High",
    "risk_reason": "Why this risk level",
    "summary": "One paragraph summary of the plan"
}}

Return ONLY valid JSON. No extra text, no markdown.
"""

    result = call_llm_json(
        system_prompt="You are a Study Plan Generator Agent. Return ONLY valid JSON.",
        user_prompt=prompt,
        fallback=fallback,
        temperature=0.3,
        agent_name="Study Plan Generator",
    )
    result["agent"] = "Study Plan Generator"
    result.setdefault("certification", learning_path["certification"])
    return result
