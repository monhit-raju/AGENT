import json
from llm_client import call_llm_json

SYSTEM_PROMPT = """You are a Mock Payload and Fixture Synthesizer. Analyze the requirement, database schema, and FastAPI entrypoint code, then generate realistic mock database records, JSON payloads, and test fixtures.

Always respond with ONLY a JSON object in this shape:
{
  "mock_data_json": "the stringified JSON payload content containing realistic mock data"
}
No text outside the JSON."""

def generate_mock_data(files: dict) -> dict:
    models_content = files.get("models.py", "")
    main_content = files.get("main.py", "")
    
    user_prompt = f"models.py:\n{models_content}\n\nmain.py:\n{main_content}"
    try:
        result = call_llm_json(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_prompt,
            provider="gemini",
            temperature=0.2
        )
        if "mock_data_json" in result and result["mock_data_json"]:
            # Try to load and re-dump to ensure it is valid JSON
            parsed = json.loads(result["mock_data_json"])
            files["tests/mock_payloads.json"] = json.dumps(parsed, indent=2)
            return files
    except Exception as e:
        print(f"[mock_data_gen] LLM call failed: {e}. Falling back to default mock payloads.")
        
    files["tests/mock_payloads.json"] = json.dumps({
        "sample_inbound_request": {
            "message": "AI multi-agent processing test run",
            "timestamp": "2026-07-29T18:00:00Z"
        }
    }, indent=2)
    return files
