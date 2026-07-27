"""
STAGE 5: Tool Selector

Input:  requirement (Stage 1) + agent list (Stage 2) + workflow (Stage 3)
Output: (a) an overall recommended tech stack for the whole system
        (b) per-agent tool/API recommendations with REASONS

Design choices that make this stage actually good instead of generic:
1. It's told what's already free/available (Groq, Gemini, SQLite) so it
   doesn't recommend something contradicting your own hackathon budget.
2. Every recommendation must include a "why" -- a tool list with no
   reasoning is just a word dump and doesn't demo well.
3. Each agent gets its OWN tools, not one blob for the whole system --
   this is what makes it look like it actually understood the workflow,
   not just pattern-matched the domain name.
4. Every tool is tagged "free_tier_available" so a judge (or your own
   team) can immediately see this was built with real constraints in
   mind, not a wishlist of paid SaaS products.
"""

from llm_client import call_llm_json

SYSTEM_PROMPT = """You are a Tool Selector for a multi-agent system
generator. You already know the overall requirement, the list of agents
chosen, and the workflow connecting them. Your job is to recommend the
best real-world tools, APIs, models, and databases for this SPECIFIC
system -- not a generic list.

Ground rules:
- Prefer tools with a genuinely free tier or open-source option whenever
  one exists and is reasonable quality (e.g. Groq or Gemini API for LLM
  calls, SQLite or PostgreSQL free tier for storage, open-source
  libraries over paid SaaS where equivalent).
- Only recommend a paid tool if there is no reasonable free alternative,
  and say so explicitly in the reason.
- Every recommendation must include a one-sentence reason tied to what
  THIS agent specifically needs to do, not a generic description of
  the tool.
- Recommend real, currently-existing tools/APIs/libraries. Do not invent
  fictional products.
- For EVERY tool, say whether it needs its own API key/credentials
  beyond the LLM keys (Groq/Gemini are already handled separately --
  never list those here). Example: a "Notification Agent" that sends
  real emails needs its own Gmail API or SMTP credentials, not just an
  LLM call. If a tool is just a Python library with no external
  account needed (e.g. SQLite, Tesseract OCR running locally), mark
  requires_api_key as false.

Always respond with ONLY a JSON object in exactly this shape:
{
  "overall_stack": {
    "llm_model": {"choice": "...", "reason": "..."},
    "backend_framework": {"choice": "...", "reason": "..."},
    "orchestration_framework": {"choice": "...", "reason": "..."},
    "database": {"choice": "...", "reason": "..."},
    "frontend": {"choice": "...", "reason": "..."}
  },
  "per_agent_tools": [
    {
      "agent_id": "id matching the agent list you were given",
      "tools": [
        {
          "name": "specific tool/API/library name",
          "purpose": "what this agent uses it for, specific to this system",
          "reason": "why this tool over alternatives, one sentence",
          "free_tier_available": true,
          "requires_api_key": true,
          "env_var_name": "SUGGESTED_ENV_VAR_NAME or null if requires_api_key is false",
          "setup_url": "real URL where a developer signs up for this / gets credentials, or null",
          "pip_package": "the pip package name needed to use this in Python, or null if none"
        }
      ]
    }
  ]
}
Give each agent 1-3 tools, not more. No text outside the JSON."""


def select_tools(requirement_json: dict, agent_plan_json: dict, workflow_json: dict) -> dict:
    return call_llm_json(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=(
            f"System requirement:\n{requirement_json}\n\n"
            f"Agents:\n{agent_plan_json}\n\n"
            f"Workflow:\n{workflow_json}"
        ),
    )


if __name__ == "__main__":
    # Manual test -- run from the AGENT root folder:
    #   python -m agents.tool_selector
    from agents.requirement_analysis import analyze_requirement
    from agents.agent_planner import plan_agents
    from agents.workflow_designer import design_workflow
    import json

    requirement = analyze_requirement("Build me an AI recruitment platform")
    plan = plan_agents(requirement)
    workflow = design_workflow(plan)
    tools = select_tools(requirement, plan, workflow)

    print("Agent Plan:")
    print(json.dumps(plan, indent=2))
    print("\nTool Recommendations:")
    print(json.dumps(tools, indent=2))