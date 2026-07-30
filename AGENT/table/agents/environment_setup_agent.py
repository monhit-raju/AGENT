from llm_client import call_llm_json

SYSTEM_PROMPT = """You are an Environment Configuration Builder. Generate complete configuration manifests (.env.example, Dockerfile, setup scripts) for the workspace project.

Always respond with ONLY a JSON object in this shape:
{
  "manifests": []
}
No text outside the JSON."""

def build_environment_setup(requirement: dict, files: dict) -> dict:
    if "Dockerfile" not in files:
        files["Dockerfile"] = "FROM python:3.10-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install -r requirements.txt\nCOPY . .\nCMD [\"uvicorn\", \"main:app\", \"--host\", \"0.0.0.0\", \"--port\", \"8000\"]\n"
    return files
