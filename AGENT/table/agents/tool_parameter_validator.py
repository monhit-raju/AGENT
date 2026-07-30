from llm_client import call_llm_json

SYSTEM_PROMPT = """You are a Tool Parameter Schema Validator. Review recommended tools and verify that their input parameters match standard JSON schema formats.

Always respond with ONLY a JSON object in this shape:
{
  "per_agent_tools": [
    {"agent_id": "id", "tools": []}
  ]
}
No text outside the JSON."""

def validate_tool_parameters(tools: dict) -> dict:
    return tools
