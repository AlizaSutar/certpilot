"""
Agent 3 — Engagement Agent
Simulates: Work IQ adaptive engagement

Builds reminders, weekly check-ins and motivation messages that respect
the employee's real calendar load (busy days, focus windows).
"""

from app.knowledge_base import get_work_signals
from app.llm_client import call_llm_json

DEFAULT_WORK_SIGNAL = {
    "meeting_hours_per_week": 20,
    "focus_hours_per_week": 12,
    "preferred_learning_slot": "Morning",
    "busy_days": ["Monday"],
    "peak_focus_time": "7am-9am",
}

DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]


def _fallback(study_plan: dict, employee_id: str, work_signal: dict,
               workload_level: str, engagement_style: str) -> dict:
    busy_days = set(work_signal.get("busy_days", []))
    free_days = [d for d in DAY_ORDER if d not in busy_days] or DAY_ORDER

    slot_time = {"Morning": "7:30 AM", "Afternoon": "2:00 PM", "Evening": "6:30 PM"}.get(
        work_signal["preferred_learning_slot"], "7:30 AM"
    )

    reminders = []
    for i, week in enumerate(study_plan.get("weekly_plan", [])[:3]):
        day = free_days[i % len(free_days)]
        reminders.append({
            "day": day,
            "time": slot_time,
            "type": "Daily study",
            "message": f"Time to focus on {week['focus']} — your {work_signal['preferred_learning_slot'].lower()} slot is protected.",
            "channel": "Microsoft Teams",
        })

    weekly_checkins = [
        {
            "week": w["week"],
            "checkin_day": "Friday",
            "checkin_time": "4:00 PM",
            "message": f"Week {w['week']} check-in: did you reach the milestone '{w['milestone']}'?",
            "if_behind": "Reschedule remaining sessions into your peak focus window and shorten the milestone scope.",
        }
        for w in study_plan.get("weekly_plan", [])
    ]

    return {
        "employee_id": employee_id,
        "certification": study_plan["certification"],
        "workload_level": workload_level,
        "engagement_style": engagement_style,
        "reminders": reminders,
        "weekly_checkins": weekly_checkins,
        "motivation_messages": [
            "Every focused session moves you closer to certification — momentum compounds.",
            f"Your {work_signal.get('peak_focus_time', 'morning')} slot is your edge. Protect it.",
            "Consistency beats intensity — short, regular sessions outperform cramming.",
        ],
        "at_risk_triggers": [
            "No study session logged for 5+ days",
            "Meeting hours exceed 25/week for two consecutive weeks",
            "Practice score drops below 60% on a topic",
        ],
        "agent": "Engagement Agent",
    }


def run(study_plan: dict, employee_id: str) -> dict:
    work_signal = get_work_signals(employee_id) or DEFAULT_WORK_SIGNAL

    meeting_hours = work_signal["meeting_hours_per_week"]
    if meeting_hours > 25:
        workload_level = "High"
        engagement_style = "gentle and brief — employee is very busy"
    elif meeting_hours > 15:
        workload_level = "Medium"
        engagement_style = "balanced — mix of reminders and motivation"
    else:
        workload_level = "Low"
        engagement_style = "active and detailed — employee has good availability"

    fallback = _fallback(study_plan, employee_id, work_signal, workload_level, engagement_style)

    weeks_text = "\n".join([f"- Week {w['week']}: {w['focus']} (milestone: {w['milestone']})" for w in study_plan.get("weekly_plan", [])])

    prompt = f"""
You are an Engagement Agent for an enterprise certification system.

EMPLOYEE WORK CONTEXT (Work IQ):
- Meeting hours per week: {work_signal['meeting_hours_per_week']}
- Focus hours per week: {work_signal['focus_hours_per_week']}
- Preferred learning slot: {work_signal['preferred_learning_slot']}
- Busy days: {', '.join(work_signal.get('busy_days', []))}
- Peak focus time: {work_signal.get('peak_focus_time', 'Morning')}
- Workload level: {workload_level}
- Engagement style: {engagement_style}

STUDY PLAN WEEKS:
{weeks_text}

Create a study reminder & engagement plan that respects the employee's busy days and protects their peak focus time.

Respond in this exact JSON format:
{{
    "employee_id": "{employee_id}",
    "certification": "{study_plan['certification']}",
    "workload_level": "{workload_level}",
    "engagement_style": "{engagement_style}",
    "reminders": [
        {{"day": "Tuesday", "time": "7:00 AM", "type": "Daily study/Weekly check-in/Milestone/At-risk alert", "message": "Personalized reminder message", "channel": "Email/Teams/Calendar"}}
    ],
    "weekly_checkins": [
        {{"week": 1, "checkin_day": "Friday", "checkin_time": "4:00 PM", "message": "End of week check-in message", "if_behind": "What to do if employee is behind"}}
    ],
    "motivation_messages": ["Motivational message 1", "Motivational message 2", "Motivational message 3"],
    "at_risk_triggers": ["Condition that triggers at-risk alert"]
}}

Return ONLY the JSON, no extra text.
"""

    result = call_llm_json(
        system_prompt="You are an Engagement Agent. Return ONLY valid JSON.",
        user_prompt=prompt,
        fallback=fallback,
        temperature=0.4,
        agent_name="Engagement Agent",
    )
    result["agent"] = "Engagement Agent"
    return result
