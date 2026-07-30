from llm_client import call_llm_json

SYSTEM_PROMPT = """You are an Agent Role Verifier. Review the agent plan to verify there are no duplicate or conflicting responsibilities. Adjust role_names or responsibilities if needed to maximize domain specialisation.

Always respond with ONLY a JSON object in this shape:
{
  "agents": [
    {
      "id": "short_snake_case_id",
      "role_name": "Human readable name",
      "responsibility": "one sentence responsibility"
    }
  ]
}
No text outside the JSON."""

def verify_agent_roles(plan: dict) -> dict:
    # Double check that there are no duplicate agent names or roles
    agents = plan.get("agents", [])
    seen = set()
    for agent in agents:
        name = agent.get("role_name", "")
        if name in seen:
            agent["role_name"] = f"{name} Specialised"
        seen.add(name)
    return plan
