"""
STAGE 2: Agent Planner

Input:  the structured requirement JSON from Stage 1
Output: a genuinely tailored list of agents for THIS system

DESIGN CHANGE (v2): earlier versions constrained the LLM to a fixed
library of ~7 generic agent types (intake_agent, ranking_agent, etc.).
That was a deliberate early reliability choice, but it caps how
specific/original the architecture can look -- a recruitment system
and a healthcare system would get suspiciously similar-looking agents.

Now the LLM invents bespoke agent roles tailored to the actual domain
(e.g. "Eligibility Verification Agent", "Document OCR Agent" for a
government-services system) instead of picking from a generic menu.
This is safe to do now because the project has enough validation
infrastructure to catch problems downstream: workflow_validator checks
structural integrity, and code_generator self-heals broken files. The
one NEW risk this introduces -- an invented id that isn't a valid
Python identifier -- is handled directly below with _sanitize_agents,
since ids get turned into function names later (run_<id>).
"""

import re
from llm_client import call_llm_json

MIN_AGENTS = 4
MAX_AGENTS = 5

SYSTEM_PROMPT = """You are an Agent Planner for a multi-agent system
generator. You are given a structured business requirement. Design the
specific agents this system actually needs -- invent roles tailored to
this domain, don't reach for generic boilerplate names.

Good: for a government services system -- "Eligibility Verification
Agent", "Document OCR Agent", "Application Status Tracker Agent".
Bad: generic names like "Processing Agent" or "Handler Agent" that
could belong to any system.

Guidelines:
- Design at least 30 to 35 agents to build a highly specialized micro-agent system.
- Every agent needs a clear, non-overlapping responsibility -- if two
  agents would do almost the same thing, make sure their input parameters or scopes are distinct.
- Give each agent an "id": a short snake_case identifier (lowercase,
  underscores only, no spaces or special characters) -- this becomes a
  Python function name later, so it must be a valid identifier.
- Give each agent a "role_name": the human-readable name a person would
  actually call it.

Always respond with ONLY a JSON object in exactly this shape:
{
  "agents": [
    {
      "id": "short_snake_case_id",
      "role_name": "Human readable name specific to this domain",
      "responsibility": "one sentence on exactly what this agent does in THIS system"
    }
  ]
}
No text outside the JSON."""


def _sanitize_id(raw_id: str, index: int) -> str:
    """
    Guarantees a valid Python identifier regardless of what the LLM
    invents: lowercase, only [a-z0-9_], can't start with a digit.
    Falls back to "agent_<index>" if nothing usable survives.
    """
    cleaned = re.sub(r"[^a-z0-9_]", "_", (raw_id or "").lower()).strip("_")
    cleaned = re.sub(r"_+", "_", cleaned)
    if not cleaned or cleaned[0].isdigit():
        cleaned = f"agent_{cleaned}" if cleaned else f"agent_{index}"
    return cleaned


def _sanitize_agents(raw_plan: dict) -> dict:
    """
    Post-processes the LLM's freeform agent list: sanitizes every id to
    a valid, unique Python identifier, and clamps the count to a sane
    range so a demo never gets a 15-agent or 1-agent system.
    """
    agents = raw_plan.get("agents", [])[:MAX_AGENTS]  # hard cap, even if the LLM ignores the range

    seen_ids = set()
    cleaned_agents = []
    for i, agent in enumerate(agents):
        base_id = _sanitize_id(agent.get("id", ""), i)
        final_id = base_id
        suffix = 2
        while final_id in seen_ids:  # guarantee uniqueness if two agents sanitize to the same id
            final_id = f"{base_id}_{suffix}"
            suffix += 1
        seen_ids.add(final_id)

        cleaned_agents.append({
            "id": final_id,
            "role_name": agent.get("role_name", final_id.replace("_", " ").title()),
            "responsibility": agent.get("responsibility", ""),
        })

    return {"agents": cleaned_agents}


def plan_agents(requirement_json: dict) -> dict:
    raw_plan = call_llm_json(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=f"Structured requirement:\n{requirement_json}",
    )
    return _sanitize_agents(raw_plan)


if __name__ == "__main__":
    # Manual test -- run from the AGENT root folder:
    #   python -m agents.agent_planner
    from agents.requirement_analysis import analyze_requirement
    import json

    requirement = analyze_requirement("Build me an AI recruitment platform")
    print("Requirement:", json.dumps(requirement, indent=2))

    plan = plan_agents(requirement)
    print("\nAgent Plan (tailored, not library-picked):")
    print(json.dumps(plan, indent=2))