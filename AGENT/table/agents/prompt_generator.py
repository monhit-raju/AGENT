"""
STAGE 4: Prompt Generator

Input:  the requirement (Stage 1) + the agent list (Stage 2)
Output: a ready-to-use system prompt for each agent

This is one of the most "wow" parts of the demo -- it's literally
writing the prompts that would power each of the generated agents,
the same way I wrote the prompts for YOUR agents in this project.
"""

from llm_client import call_llm_json

SYSTEM_PROMPT = """You are a Prompt Generator for a multi-agent system
generator. You are given the overall system requirement and a list of
agents that were chosen for it. Write an expert-level, highly detailed,
and structured system prompt for EACH agent. The prompts must guarantee
reliable, professional, and high-quality outputs when executed at runtime.

Each system prompt you write must include:
1. ROLE & MISSION: A clear definition of the agent's role and its ultimate goal.
2. DETAILED RESPONSIBILITIES: 3-5 specific, concrete tasks this agent must perform within the context of the overall business spec.
3. REASONING & GUIDELINES: Step-by-step logic, domain best practices, and decision guidelines (Chain of Thought).
4. EDGE CASES: Instructions on how to handle missing data, invalid formats, or out-of-scope requests.
5. RESPONSE STYLE: Professional tone constraints, formatting rules, and structure.

Make each prompt rich, structured, and comprehensive (approx. 100-250 words per prompt).

Always respond with ONLY a JSON object in exactly this shape:
{
  "prompts": [
    {"agent_id": "id matching the agent list you were given", "system_prompt": "the full prompt text"}
  ]
}
No text outside the JSON."""


def generate_prompts(requirement_json: dict, agent_plan_json: dict) -> dict:
    return call_llm_json(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=(
            f"System requirement:\n{requirement_json}\n\n"
            f"Agents to write prompts for:\n{agent_plan_json}"
        ),
    )


if __name__ == "__main__":
    # Manual test -- run from the AGENT root folder:
    #   python -m agents.prompt_generator
    from table.agents.requirement_analysis import analyze_requirement
    from table.agents.agent_planner import plan_agents
    import json

    requirement = analyze_requirement("Build me an AI recruitment platform")
    plan = plan_agents(requirement)
    prompts = generate_prompts(requirement, plan)

    print("Agent Plan:")
    print(json.dumps(plan, indent=2))
    print("\nGenerated Prompts:")
    print(json.dumps(prompts, indent=2))
