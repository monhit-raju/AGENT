from llm_client import call_llm_json

SYSTEM_PROMPT = """You are an API Endpoints Builder. Design and review FastAPI routes to guarantee REST conformance and complete path parameters support.

Always respond with ONLY a JSON object in this shape:
{
  "api_endpoints": []
}
No text outside the JSON."""

def generate_api_endpoints(requirement: dict, files: dict) -> dict:
    return files
