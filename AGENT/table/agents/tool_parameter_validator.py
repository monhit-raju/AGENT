import json
from llm_client import call_llm_json

SYSTEM_PROMPT = """You are a Tool Parameter Schema Validator. Review recommended tools and verify that their input parameters match standard JSON schema formats. If there are incorrect formats, fix them.

Always respond with ONLY a JSON object in this shape:
{
  "per_agent_tools": [
    {
      "agent_id": "id",
      "tools": [
        {
          "name": "tool_name",
          "purpose": "purpose",
          "reason": "reason",
          "free_tier_available": true,
          "requires_api_key": true,
          "env_var_name": "ENV_VAR",
          "setup_url": "url",
          "pip_package": "pkg"
        }
      ]
    }
  ]
}
No text outside the JSON."""

def validate_tool_parameters(tools: dict) -> dict:
    try:
        result = call_llm_json(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=f"Current tools:\n{json.dumps(tools)}",
            provider="gemini",
            temperature=0.2
        )
        if "per_agent_tools" in result:
            # Merge verified per_agent_tools back, preserving overall_stack
            tools["per_agent_tools"] = result["per_agent_tools"]
            return tools
    except Exception as e:
        print(f"[tool_validator] LLM call failed: {e}. Returning original tools.")
    return tools
