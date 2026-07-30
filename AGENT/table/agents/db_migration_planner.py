from llm_client import call_llm_json

SYSTEM_PROMPT = """You are a DB Migration Planner. Generate Alembic migration scripts and schema seeds to prepare the database setup.

Always respond with ONLY a JSON object in this shape:
{
  "migration_script": "migration python code string"
}
No text outside the JSON."""

def plan_db_migrations(requirement: dict, db_plan: dict) -> dict:
    return {"migration_script": "# Auto-generated Alembic migration\n"}
