from llm_client import call_llm_json

SYSTEM_PROMPT = """You are a Workflow Latency Optimizer. Review the graph nodes and edges to ensure there are no dead-ends or cycle blocks that introduce runtime delay.

Always respond with ONLY a JSON object in this shape:
{
  "nodes": [{"id": "id", "label": "label"}],
  "edges": [{"from": "id", "to": "id", "condition": "always"}]
}
No text outside the JSON."""

def optimize_workflow(workflow: dict) -> dict:
    return workflow
