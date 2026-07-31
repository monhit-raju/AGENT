import json
from llm_client import call_llm_json

SYSTEM_PROMPT = """You are a DB Migration Planner. Generate Alembic migration scripts and schema seeds to prepare the database setup.

Always respond with ONLY a JSON object in this shape:
{
  "migration_script": "migration python code string"
}
No text outside the JSON."""

def plan_db_migrations(requirement: dict, db_plan: dict) -> dict:
    try:
        result = call_llm_json(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=f"Requirement:\n{json.dumps(requirement)}\n\nDatabase Plan:\n{json.dumps(db_plan)}",
            provider="gemini",
            temperature=0.2
        )
        if "migration_script" in result:
            return result
    except Exception as e:
        print(f"[migration_planner] LLM call failed: {e}. Returning default migration script.")
    return {"migration_script": "# Auto-generated Alembic migration\n"}
