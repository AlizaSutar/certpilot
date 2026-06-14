"""
CertPilot Knowledge Base
========================
Lightweight, fully offline retrieval layer (no model downloads required -
keeps CertPilot deployable in network-restricted enterprise environments).

- `search_knowledge_base()`     -> simulates **Foundry IQ** grounded retrieval
  over the enterprise certification guide & learning reports (cited, RAG-style).
- `search_certification_data()` -> simulates **Fabric IQ** semantic layer over
  structured certification metadata (roles, skills, prerequisites).
- `get_work_signals()`          -> simulates **Work IQ** (calendar / meeting
  load signals from Microsoft 365).
"""

import os
import json
import re
from collections import Counter

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
DOCS_DIR = os.path.join(BASE_DIR, "docs")

_TOKEN_RE = re.compile(r"[a-zA-Z][a-zA-Z0-9\-]+")

_docs_index = []  # list of {content, source, section, tokens}
_data_index = []  # list of {content, source, cert_id, tokens}
_initialized = False


def _tokenize(text: str) -> list:
    return [t.lower() for t in _TOKEN_RE.findall(text)]


def _score(query_tokens: list, doc_tokens: Counter) -> float:
    """Simple term-overlap relevance score (no embeddings/downloads needed)."""
    if not doc_tokens:
        return 0.0
    total = sum(doc_tokens.values())
    score = 0.0
    for t in query_tokens:
        if t in doc_tokens:
            score += doc_tokens[t] / total
    return score


def _build_entry(content: str, **meta) -> dict:
    return {"content": content, "tokens": Counter(_tokenize(content)), **meta}


def load_documents():
    """Load markdown docs — simulates Foundry IQ knowledge base."""
    global _docs_index
    _docs_index = []

    for doc_file in ["certification_guide.md", "learning_report.md"]:
        path = os.path.join(DOCS_DIR, doc_file)
        if not os.path.exists(path):
            continue

        with open(path, "r", encoding="utf-8") as f:
            content = f.read()

        sections = content.split("\n## ")
        for i, section in enumerate(sections):
            if section.strip():
                _docs_index.append(_build_entry(section.strip(), source=doc_file, section=i))

    print(f"✅ Loaded {len(_docs_index)} document sections into knowledge base (Foundry IQ)")


def load_structured_data():
    """Load certification metadata — simulates Fabric IQ semantic layer."""
    global _data_index
    _data_index = []

    cert_path = os.path.join(DATA_DIR, "certifications.json")
    if not os.path.exists(cert_path):
        return

    with open(cert_path, "r") as f:
        cert_data = json.load(f)

    for cert in cert_data["certifications"]:
        text = (
            f"Certification {cert['id']} - {cert['name']}. "
            f"Required skills: {', '.join(cert['skills'])}. "
            f"Recommended hours: {cert['recommended_hours']}. "
            f"Target roles: {', '.join(cert['roles'])}. "
            f"Prerequisites: {', '.join(cert['prerequisites']) if cert['prerequisites'] else 'None'}. "
            f"Pass threshold: {cert['pass_threshold']}%."
        )
        _data_index.append(_build_entry(text, source="certifications.json", cert_id=cert["id"]))

    print(f"✅ Loaded {len(_data_index)} certifications into structured data (Fabric IQ)")


def search_knowledge_base(query: str, n_results: int = 3) -> list:
    """Search certification documents — simulates Foundry IQ grounded retrieval."""
    initialize()
    query_tokens = _tokenize(query)

    ranked = sorted(_docs_index, key=lambda e: _score(query_tokens, e["tokens"]), reverse=True)
    output = []
    for entry in ranked[:n_results]:
        output.append({
            "content": entry["content"],
            "source": entry["source"],
            "citation": f"[Source: {entry['source']}, Section {entry['section']}]",
        })
    return output


def search_certification_data(query: str, n_results: int = 3) -> list:
    """Search structured certification data — simulates Fabric IQ semantic layer."""
    initialize()
    query_tokens = _tokenize(query)

    ranked = sorted(_data_index, key=lambda e: _score(query_tokens, e["tokens"]), reverse=True)
    output = []
    for entry in ranked[:n_results]:
        output.append({
            "content": entry["content"],
            "source": entry["source"],
            "cert_id": entry.get("cert_id", ""),
            "citation": f"[Source: {entry['source']}]",
        })
    return output


def get_certifications() -> list:
    path = os.path.join(DATA_DIR, "certifications.json")
    with open(path, "r") as f:
        return json.load(f)["certifications"]


def get_learner_data(employee_id: str = None):
    """Load learner profiles — synthetic employee data."""
    path = os.path.join(DATA_DIR, "learners.json")
    with open(path, "r") as f:
        data = json.load(f)

    if employee_id:
        for learner in data["learners"]:
            if learner["id"] == employee_id:
                return learner
        return None
    return data["learners"]


def get_work_signals(employee_id: str = None):
    """Load work signals — simulates Work IQ."""
    path = os.path.join(DATA_DIR, "work_signals.json")
    with open(path, "r") as f:
        data = json.load(f)

    if employee_id:
        for signal in data["work_signals"]:
            if signal["employee_id"] == employee_id:
                return signal
        return None
    return data["work_signals"]


def initialize():
    """Load everything into the knowledge base (idempotent)."""
    global _initialized
    if _initialized:
        return
    load_documents()
    load_structured_data()
    _initialized = True
    print("🚀 CertPilot knowledge base ready!")
