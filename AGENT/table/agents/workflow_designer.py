"""
STAGE 3: Workflow Designer

Input:  the agent list from Stage 2 (Agent Planner)
Output: an ordered flow describing which agent runs after which

This is what Person 3 will feed straight into React Flow to draw the
diagram, so keep the shape simple: a list of nodes and a list of edges.
"""

from table.agents.agent_planner import plan_agents
from llm_client import call_llm_json

SYSTEM_PROMPT = """You are a Workflow Designer for a multi-agent system
generator. You are given a list of agents that were already chosen for
this system. Decide the order they should run in and how they connect.

Always respond with ONLY a JSON object in exactly this shape:
{
  "nodes": [
    {"id": "agent_id_from_input", "label": "Human readable name"}
  ],
  "edges": [
    {"from": "agent_id", "to": "agent_id", "condition": "always, or a short condition like 'if flagged'"}
  ]
}
Include a "user" node as the starting point (id: "user", label: "User Request").
The flow should start at "user" and end at whichever agent gives the final
response back. No text outside the JSON."""


def design_workflow(agent_plan_json: dict) -> dict:
    return call_llm_json(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=f"Agents to connect:\n{agent_plan_json}",
    )


if __name__ == "__main__":
    # Manual test -- run from the AGENT root folder:
    #   python -m agents.workflow_designer
    from table.agents.requirement_analysis import analyze_requirement
    import json

    requirement = analyze_requirement("Build me an AI recruitment platform")
    plan = plan_agents(requirement)
    workflow = design_workflow(plan)

    print("Agent Plan:")
    print(json.dumps(plan, indent=2))
    print("\nWorkflow:")
    print(json.dumps(workflow, indent=2))
