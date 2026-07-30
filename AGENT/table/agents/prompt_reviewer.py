from llm_client import call_llm_json

SYSTEM_PROMPT = """You are a Prompt QA Inspector. Audit agent system prompts to ensure they contain strict guidelines, clear input/output types, and safe fallback rules.

Always respond with ONLY a JSON object in this shape:
{
  "prompts": [
    {"agent_id": "id", "system_prompt": "prompt text"}
  ]
}
No text outside the JSON."""

def review_prompts(prompts: dict) -> dict:
    for p in prompts.get("prompts", []):
        p["system_prompt"] += "\nFormat response cleanly. Ensure errors are handled gracefully."
    return prompts
