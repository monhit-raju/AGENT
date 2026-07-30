import json
from llm_client import call_llm_json

DOC_GEN_SYSTEM_PROMPT = """You are an expert technical writer. Your task is to write a comprehensive API documentation guide (Markdown format) for the newly compiled multi-agent system.
Detail every agent, the pipeline workflow graph, the API entrypoints, and payload schema structures.

Always respond in ONLY a JSON object in this exact shape:
{
  "documentation_markdown": "complete developer API handbook markdown content"
}
No other text outside the JSON."""

def generate_api_documentation(requirement: dict, agent_plan: dict, workflow: dict, tools: dict) -> dict:
    user_prompt = (
        f"Business Spec:\n{json.dumps(requirement)}\n\n"
        f"Agent Plan:\n{json.dumps(agent_plan)}\n\n"
        f"Workflow Map:\n{json.dumps(workflow)}\n\n"
        f"Tools Config:\n{json.dumps(tools)}"
    )
    return call_llm_json(
        system_prompt=DOC_GEN_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        provider="gemini",
        temperature=0.2
    )
