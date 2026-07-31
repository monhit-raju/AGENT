import json
from llm_client import call_llm_json

SYSTEM_PROMPT = """You are a Workflow Latency Optimizer. Review the graph nodes and edges to ensure there are no dead-ends or cycle blocks that introduce runtime delay. Optimize parallel execution paths if possible.

Always respond with ONLY a JSON object in this shape:
{
  "nodes": [{"id": "id", "label": "label"}],
  "edges": [{"from": "id", "to": "id", "condition": "always"}]
}
No text outside the JSON."""

def optimize_workflow(workflow: dict) -> dict:
    try:
        result = call_llm_json(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=f"Current Workflow:\n{json.dumps(workflow)}",
            provider="gemini",
            temperature=0.2
        )
        if "nodes" in result and "edges" in result:
            return result
    except Exception as e:
        print(f"[optimizer] LLM call failed: {e}. Returning original workflow.")
    return workflow
