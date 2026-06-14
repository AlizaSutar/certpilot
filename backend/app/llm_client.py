"""
Shared LLM client for CertPilot agents.

Uses GitHub Models (gpt-4o) via an OpenAI-compatible endpoint when
GITHUB_TOKEN (or AZURE_OPENAI_* settings) are configured. When no
credentials are present, CertPilot runs in "simulation mode": every
agent falls back to a deterministic, data-grounded response so the
whole product can be demoed end-to-end without any keys.
"""

import os
import json
from dotenv import load_dotenv

load_dotenv()

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")
AZURE_OPENAI_API_KEY = os.environ.get("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_ENDPOINT = os.environ.get("AZURE_OPENAI_ENDPOINT")
MODEL_NAME = os.environ.get("AZURE_AI_MODEL_DEPLOYMENT", "gpt-4o")

LLM_AVAILABLE = bool(GITHUB_TOKEN or (AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT))

_client = None


def _get_client():
    """Lazily build an OpenAI-compatible client. Returns None if unavailable."""
    global _client
    if _client is not None:
        return _client

    try:
        from openai import OpenAI

        if GITHUB_TOKEN:
            _client = OpenAI(
                base_url="https://models.inference.ai.azure.com",
                api_key=GITHUB_TOKEN,
            )
        elif AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT:
            _client = OpenAI(
                base_url=AZURE_OPENAI_ENDPOINT,
                api_key=AZURE_OPENAI_API_KEY,
            )
    except Exception as exc:  # pragma: no cover - defensive
        print(f"⚠️  LLM client unavailable: {exc}")
        _client = None

    return _client


def _clean_json(raw: str) -> dict:
    raw = raw.strip()
    if "```" in raw:
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    first = raw.find("{")
    last = raw.rfind("}")
    if first != -1 and last != -1:
        raw = raw[first:last + 1]
    return json.loads(raw)


def call_llm_json(system_prompt: str, user_prompt: str, fallback: dict,
                   temperature: float = 0.3, agent_name: str = "Agent") -> dict:
    """
    Call the LLM and parse a JSON response. If no LLM is configured, or the
    call/parse fails for any reason, return `fallback` (already a dict)
    so CertPilot keeps working in simulation mode.
    """
    client = _get_client()
    if client is None:
        print(f"🟡 {agent_name}: running in simulation mode (no LLM configured)")
        return fallback

    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=temperature,
        )
        raw = response.choices[0].message.content
        return _clean_json(raw)
    except Exception as exc:
        print(f"⚠️  {agent_name}: LLM call failed ({exc}); using simulation fallback")
        return fallback
