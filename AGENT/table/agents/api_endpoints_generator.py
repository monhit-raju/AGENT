import json
from llm_client import call_llm_json

SYSTEM_PROMPT = """You are an API Endpoints Builder. Review the existing main.py file and the system requirements, and generate an updated, fully-featured main.py with appropriate FastAPI routes, including CRUD routes for database models if models.py is defined, and correct parameter validation.

Always respond with ONLY a JSON object in this shape:
{
  "main_py_content": "the complete content of main.py as a string"
}
No text outside the JSON."""

def generate_api_endpoints(requirement: dict, files: dict) -> dict:
    main_content = files.get("main.py", "")
    models_content = files.get("models.py", "")
    
    user_prompt = f"Requirement:\n{json.dumps(requirement)}\n\nmodels.py:\n{models_content}\n\ncurrent main.py:\n{main_content}"
    try:
        result = call_llm_json(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_prompt,
            provider="gemini",
            temperature=0.2
        )
        if "main_py_content" in result and result["main_py_content"]:
            files["main.py"] = result["main_py_content"]
    except Exception as e:
        print(f"[endpoints_builder] LLM call failed: {e}. Keeping original main.py.")
    return files
