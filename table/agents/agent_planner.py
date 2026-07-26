"""
STAGE 2: Agent Planner

Input:  the structured requirement JSON from Stage 1
Output: a list of which agents (from our fixed library) are needed

IMPORTANT DESIGN CHOICE: we do NOT let the LLM invent brand new agent
types from nothing -- that's unreliable and hard to demo live. Instead
we give it a fixed library to choose from and configure. This is far
more consistent for a hackathon demo.
"""

from llm_client import call_llm_json

# Your pre-built agent archetype library. Add more here if you have time,
# but 6-8 is plenty. Keep descriptions short and clear -- the LLM picks
# from this list, it doesn't invent new ones.
AGENT_LIBRARY = [
    {"type": "intake_agent", "description": "Receives and routes the initial user/customer request"},
    {"type": "retriever_agent", "description": "Looks up relevant information from a knowledge base or database"},
    {"type": "ranking_agent", "description": "Scores and ranks multiple candidates/options against criteria"},
    {"type": "decision_agent", "description": "Makes a decision or recommendation based on gathered info"},
    {"type": "notification_agent", "description": "Sends updates/messages to the end user"},
    {"type": "validation_agent", "description": "Checks output/data against rules before it proceeds"},
    {"type": "human_handoff_agent", "description": "Escalates to a human when the AI can't resolve something"},
]

SYSTEM_PROMPT = f"""You are an Agent Planner for a multi-agent system generator.
You are given a structured requirement. Choose which agents (ONLY from the
library below) are needed to satisfy it, and give each a specific role name.

Agent library you must choose from:
{AGENT_LIBRARY}

Always respond with ONLY a JSON object in exactly this shape:
{{
  "agents": [
    {{
      "id": "short_snake_case_id",
      "type": "one of the library types above",
      "role_name": "Human readable name, e.g. 'Resume Screening Agent'",
      "responsibility": "one sentence on what this specific agent does here"
    }}
  ]
}}
Pick 3-6 agents. No text outside the JSON."""


def plan_agents(requirement_json: dict) -> dict:
    return call_llm_json(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=f"Structured requirement:\n{requirement_json}",
    )


if __name__ == "__main__":
    # Manual test -- run this file directly: python agents/agent_planner.py
    from table.agents.requirement_analysis import analyze_requirement
    import json

    requirement = analyze_requirement("Build me an AI recruitment platform")
    print("Requirement:", json.dumps(requirement, indent=2))

    plan = plan_agents(requirement)
    print("\nAgent Plan:")
    print(json.dumps(plan, indent=2))