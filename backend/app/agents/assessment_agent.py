"""
Agent 4 — Assessment Agent
Simulates: Foundry IQ grounded question generation + smart remediation loop-back

1. generate_questions() — builds a short practice assessment for the target
   certification, grounded in the knowledge base topics.
2. evaluate_answers() — scores submitted answers, breaks down by topic.
3. smart_loop_back() — if the learner fails, produces a targeted remediation
   plan for the weak topics only (not a full restart).
"""

from app.knowledge_base import search_knowledge_base
from app.llm_client import call_llm_json

OPTION_LETTERS = ["A", "B", "C", "D"]


def _fallback_questions(certification: str, topics: list) -> dict:
    questions = []
    for i, topic in enumerate(topics[:5] or ["General knowledge"]):
        questions.append({
            "id": i + 1,
            "topic": topic,
            "question": f"Which statement best reflects a core best practice for {topic} in {certification}?",
            "options": {
                "A": f"Follow Microsoft's recommended {topic} guidance and validate with monitoring",
                "B": f"Skip {topic} configuration to save time",
                "C": f"Hard-code credentials related to {topic}",
                "D": f"Disable logging for {topic}",
            },
            "correct_answer": "A",
            "explanation": f"Microsoft Learn recommends following documented guidance and validating {topic} with monitoring/observability.",
            "citation": "[Source: certification_guide.md]",
            "difficulty": "Medium",
        })
    return {"certification": certification, "questions": questions}


def generate_questions(certification: str, topics: list) -> dict:
    insights = search_knowledge_base(f"{certification} exam questions {' '.join(topics)}")
    context = "\n".join([f"{r['citation']}\n{r['content']}" for r in insights])

    fallback = _fallback_questions(certification, topics)

    prompt = f"""
You are an Assessment Agent for an enterprise certification system.

CERTIFICATION: {certification}
TOPICS TO ASSESS: {', '.join(topics)}

KNOWLEDGE BASE CONTEXT:
{context}

Create a short practice assessment (one question per topic, max 5 questions).

Respond in this exact JSON format:
{{
    "certification": "{certification}",
    "questions": [
        {{
            "id": 1,
            "topic": "Topic name",
            "question": "Question text?",
            "options": {{"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"}},
            "correct_answer": "A",
            "explanation": "Why this is correct",
            "citation": "source citation",
            "difficulty": "Easy/Medium/Hard"
        }}
    ]
}}

Return ONLY the JSON, no extra text.
"""

    result = call_llm_json(
        system_prompt="You are an Assessment Agent. Return ONLY valid JSON.",
        user_prompt=prompt,
        fallback=fallback,
        temperature=0.4,
        agent_name="Assessment Agent (questions)",
    )
    result.setdefault("certification", certification)
    return result


def evaluate_answers(questions: dict, answers: dict) -> dict:
    qlist = questions.get("questions", [])
    total = len(qlist)
    correct = 0
    topic_breakdown = {}

    for q in qlist:
        qid = str(q["id"])
        given = answers.get(qid)
        is_correct = given == q["correct_answer"]
        if is_correct:
            correct += 1
        topic = q["topic"]
        bucket = topic_breakdown.setdefault(topic, {"correct": 0, "total": 0})
        bucket["total"] += 1
        if is_correct:
            bucket["correct"] += 1

    score = round((correct / total) * 100) if total else 0
    passed = score >= 70

    return {
        "score": score,
        "correct": correct,
        "total": total,
        "passed": passed,
        "status": "passed" if passed else "needs_remediation",
        "topic_breakdown": topic_breakdown,
    }


def smart_loop_back(evaluation: dict, certification: str) -> dict:
    weak_topics = [t for t, b in evaluation["topic_breakdown"].items() if b["total"] and b["correct"] / b["total"] < 0.7]

    fallback = {
        "remediation_needed": bool(weak_topics),
        "weak_topics": weak_topics,
        "remediation_days": max(1, len(weak_topics)),
        "daily_plan": [
            {
                "day": i + 1,
                "focus_topic": topic,
                "specific_gaps": [f"Review {topic} fundamentals", f"Hands-on lab for {topic}"],
                "study_actions": [f"Re-read {topic} section of the certification guide", "Attempt 5 targeted practice questions"],
                "time_needed": "1.5 hours",
                "citation": "[Source: certification_guide.md]",
            }
            for i, topic in enumerate(weak_topics)
        ],
        "practice_focus": f"Focus next attempt on: {', '.join(weak_topics)}" if weak_topics else "Maintain current performance across all topics.",
        "confidence_boost": f"You answered {evaluation['correct']}/{evaluation['total']} correctly — solid foundation, just a few targeted gaps to close.",
        "estimated_ready_in": f"{max(1, len(weak_topics))} day(s)" if weak_topics else "Ready now",
    }

    if not weak_topics:
        return fallback

    prompt = f"""
You are an Assessment Agent producing a smart remediation loop-back for an enterprise certification system.

CERTIFICATION: {certification}
EVALUATION: {evaluation}
WEAK TOPICS: {weak_topics}

Create a short, targeted remediation plan covering ONLY the weak topics (not a full restart).

Respond in this exact JSON format:
{{
    "remediation_needed": true,
    "weak_topics": {weak_topics},
    "remediation_days": 3,
    "daily_plan": [
        {{"day": 1, "focus_topic": "Topic name", "specific_gaps": ["gap1", "gap2"], "study_actions": ["action1", "action2"], "time_needed": "1.5 hours", "citation": "source citation"}}
    ],
    "practice_focus": "What to focus on in next attempt",
    "confidence_boost": "Encouraging message acknowledging what they got right",
    "estimated_ready_in": "X days"
}}

Return ONLY the JSON, no extra text.
"""

    result = call_llm_json(
        system_prompt="You are an Assessment Agent. Return ONLY valid JSON.",
        user_prompt=prompt,
        fallback=fallback,
        temperature=0.3,
        agent_name="Assessment Agent (remediation)",
    )
    return result


def run(learning_path: dict, employee_id: str, answers: dict = None) -> dict:
    certification = learning_path["certification"]
    topics = [t["topic"] for t in learning_path.get("learning_topics", [])]

    questions = generate_questions(certification, topics)
    result = {"agent": "Assessment Agent", "employee_id": employee_id, "questions": questions}

    if answers:
        evaluation = evaluate_answers(questions, answers)
        result.update(evaluation)

        if not evaluation["passed"]:
            result["remediation"] = smart_loop_back(evaluation, certification)
        else:
            result["remediation"] = None
            result["next_recommendation"] = f"Great work — {certification} mastered. Consider the next certification in your learning path."
    else:
        result["score"] = None
        result["passed"] = None
        result["status"] = "pending"
        result["topic_breakdown"] = {}

    return result
