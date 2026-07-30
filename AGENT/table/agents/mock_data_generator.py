import json
from llm_client import call_llm_json

SYSTEM_PROMPT = """You are a Mock Payload and Fixture Synthesizer. Generate sample payloads and dummy inputs to aid automation testing suites.

Always respond with ONLY a JSON object in this shape:
{
  "mock_data": {}
}
No text outside the JSON."""

def generate_mock_data(files: dict) -> dict:
    files["tests/mock_payloads.json"] = json.dumps({
        "sample_inbound_request": {
            "message": "AI recruitment processing test run",
            "timestamp": "2026-07-29T18:00:00Z"
        }
    }, indent=2)
    return files
