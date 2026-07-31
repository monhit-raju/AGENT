import json
from llm_client import call_llm_json

SYSTEM_PROMPT = """You are a Core Algorithm Logic Engineer. Review the generated agent logic files to optimize algorithms, ensure correct data parsing, and add necessary mathematical or logical helper functions.

Always respond with ONLY a JSON object in this shape:
{
  "agent_files": {
    "agent_id_here": "the updated python file content"
  }
}
No text outside the JSON."""

def generate_core_logic(requirement: dict, files: dict) -> dict:
    # Filter files for agent files
    agent_files = {path: content for path, content in files.items() if path.startswith("agents/") and path != "agents/__init__.py"}
    if not agent_files:
        return files
        
    user_prompt = f"Requirement:\n{json.dumps(requirement)}\n\nCurrent agent files:\n{json.dumps(agent_files)}"
    try:
        result = call_llm_json(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_prompt,
            provider="gemini",
            temperature=0.2
        )
        if "agent_files" in result:
            for path, updated_content in result["agent_files"].items():
                # Ensure the path is correct
                norm_path = path if path.startswith("agents/") else f"agents/{path}"
                if norm_path in files:
                    files[norm_path] = updated_content
    except Exception as e:
        print(f"[core_logic] LLM call failed: {e}. Keeping original logic files.")
    return files
