import json
from llm_client import call_llm_json

SYSTEM_PROMPT = """You are an Environment Configuration Builder. Based on the system requirement and files structure, generate a custom Dockerfile and any docker-compose.yml or setup scripts required.

Always respond with ONLY a JSON object in this shape:
{
  "dockerfile": "Dockerfile content",
  "docker_compose": "docker-compose.yml content or empty string",
  "setup_script": "setup.sh or setup.ps1 script content or empty string"
}
No text outside the JSON."""

def build_environment_setup(requirement: dict, files: dict) -> dict:
    try:
        result = call_llm_json(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=f"Requirement:\n{json.dumps(requirement)}\n\nFiles list:\n{list(files.keys())}",
            provider="gemini",
            temperature=0.2
        )
        if "dockerfile" in result and result["dockerfile"]:
            files["Dockerfile"] = result["dockerfile"]
        if "docker_compose" in result and result["docker_compose"]:
            files["docker-compose.yml"] = result["docker_compose"]
        if "setup_script" in result and result["setup_script"]:
            files["setup.sh"] = result["setup_script"]
    except Exception as e:
        print(f"[env_setup] LLM call failed: {e}. Using fallback setup.")
        if "Dockerfile" not in files:
            files["Dockerfile"] = "FROM python:3.10-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install -r requirements.txt\nCOPY . .\nCMD [\"uvicorn\", \"main:app\", \"--host\", \"0.0.0.0\", \"--port\", \"8000\"]\n"
    return files
