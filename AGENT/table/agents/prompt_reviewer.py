import json
from llm_client import call_llm_json

SYSTEM_PROMPT = """You are a Prompt QA Inspector. Audit agent system prompts to ensure they contain strict guidelines, clear input/output types, and safe fallback rules. Add any missing guidelines.

Always respond with ONLY a JSON object in this shape:
{
  "prompts": [
    {"agent_id": "id", "system_prompt": "prompt text"}
  ]
}
No text outside the JSON."""

def review_prompts(prompts: dict) -> dict:
    try:
        result = call_llm_json(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=f"Current prompts:\n{json.dumps(prompts)}",
            provider="gemini",
            temperature=0.2
        )
        if "prompts" in result:
            return result
    except Exception as e:
        print(f"[prompt_reviewer] LLM call failed: {e}. Falling back to rule-based prompt review.")
    
    # Fallback rule-based enhancement
    for p in prompts.get("prompts", []):
        p["system_prompt"] += "\nFormat response cleanly. Ensure errors are handled gracefully."
    return prompts
