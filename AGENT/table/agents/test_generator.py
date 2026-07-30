import json
from llm_client import call_llm_json

TEST_GEN_SYSTEM_PROMPT = """You are a senior Software Quality Assurance Engineer. Your task is to write automated pytest checks for the generated FastAPI backend system.
Review the planned agents, routing workflow, and files structure. Generate a complete python test file (named `test_main.py`) that uses `fastapi.testclient.TestClient` to assert `/run` behavior with simulated input values.

Always respond in ONLY a JSON object in this exact shape:
{
  "test_code": "complete python pytest code for test_main.py"
}
No other text outside the JSON."""

def generate_test_suite(requirement: dict, agent_plan: dict, workflow: dict, generated_code: dict) -> dict:
    # Filter files content to avoid token blowup, just pass file names & structure
    files_summary = {path: "Code length: " + str(len(content)) for path, content in generated_code.items()}
    user_prompt = (
        f"Business Spec:\n{json.dumps(requirement)}\n\n"
        f"Agent Plan:\n{json.dumps(agent_plan)}\n\n"
        f"Workflow Map:\n{json.dumps(workflow)}\n\n"
        f"Files Generated:\n{json.dumps(files_summary)}"
    )
    return call_llm_json(
        system_prompt=TEST_GEN_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        provider="gemini",
        temperature=0.2
    )
