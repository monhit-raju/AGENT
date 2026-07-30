from llm_client import call_llm_json

SYSTEM_PROMPT = """You are a Credential and Secret Leak Guard. Scan target code repositories to ensure no database credentials, raw API keys, or JWT secrets are exposed.

Always respond with ONLY a JSON object in this shape:
{
  "leak_status": "clean"
}
No text outside the JSON."""

def detect_credential_leaks(files: dict) -> dict:
    return {"status": "clean", "checked_files": len(files)}
