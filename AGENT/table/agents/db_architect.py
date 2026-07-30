import json
from llm_client import call_llm_json

DB_ARCHITECT_SYSTEM_PROMPT = """You are a senior Database Architect. Your task is to analyze the business specifications and planned agents for a system, and plan a database schema structure.
If the system requires state or database storage (e.g. database model configurations for users, feedback logs, data points), output a SQLAlchemy model configuration. If no state is needed, create a simple logs database structure.

Always respond in ONLY a JSON object in this exact shape:
{
  "db_selected": "sqlite" or "postgresql" or "none",
  "reason": "short explanation of why database is/is not recommended",
  "schema_code": "the python SQLAlchemy code containing Table models matching this architecture",
  "setup_instructions": "markdown instructions on how to install and migrate"
}
No other text outside the JSON."""

def architect_database(requirement: dict, agent_plan: dict) -> dict:
    user_prompt = (
        f"Business Spec:\n{json.dumps(requirement)}\n\n"
        f"Agent Plan:\n{json.dumps(agent_plan)}"
    )
    return call_llm_json(
        system_prompt=DB_ARCHITECT_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        provider="gemini",
        temperature=0.2
    )
