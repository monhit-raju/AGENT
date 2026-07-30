import json
from llm_client import call_llm_json

DIAGRAMMER_SYSTEM_PROMPT = """You are a software visualization engineer. Your task is to write a Mermaid.js diagram representing the detailed multi-agent data flow graph.
Outline agent nodes, conditions, triggers, database tables, and the final exit path.

Always respond in ONLY a JSON object in this exact shape:
{
  "mermaid_diagram": "the complete mermaid diagram string starting with graph TD or similar"
}
No other text outside the JSON."""

def generate_mermaid_diagram(requirement: dict, agent_plan: dict, workflow: dict) -> dict:
    user_prompt = (
        f"Business Spec:\n{json.dumps(requirement)}\n\n"
        f"Agent Plan:\n{json.dumps(agent_plan)}\n\n"
        f"Workflow Map:\n{json.dumps(workflow)}"
    )
    return call_llm_json(
        system_prompt=DIAGRAMMER_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        provider="gemini",
        temperature=0.2
    )
