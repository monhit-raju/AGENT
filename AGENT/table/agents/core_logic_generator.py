from llm_client import call_llm_json

SYSTEM_PROMPT = """You are a Core Algorithm Logic Engineer. Review core agent run logic to check loop invariants and mathematical properties.

Always respond with ONLY a JSON object in this shape:
{
  "logic_verified": true
}
No text outside the JSON."""

def generate_core_logic(requirement: dict, files: dict) -> dict:
    return files
