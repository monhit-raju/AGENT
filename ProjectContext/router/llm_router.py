"""
LLM Router -- single source of truth for "which provider handles which
pipeline stage, and why."

The actual failover logic (try provider X, fall back to Y on failure)
already lives in llm_client.call_llm_json -- this module doesn't
duplicate that. What this adds is an explicit, documented ROUTING TABLE
so the decision of "why does Stage 4 use Gemini but Stage 1 uses Groq"
is visible in one place instead of buried inside each agent file. This
is useful both for your own team's clarity and as a talking point in
your demo: "we route each stage to the provider best suited for it,
with automatic failover."
"""

# Maps each pipeline stage to its preferred provider.
# "groq"   -- fast, used for structured reasoning stages where speed
#             matters most for a live demo (analysis, planning, workflow).
# "gemini" -- used for stages that benefit more from generation quality
#             than raw speed (writing prompts, writing code).
STAGE_PROVIDER_MAP = {
    "business_understanding": "groq",
    "agent_planner": "groq",
    "workflow_designer": "groq",
    "prompt_generator": "gemini",
    "tool_selector": "groq",
    "code_generator": "gemini",
}


def get_provider_for_stage(stage_name: str) -> str:
    """
    Looks up which provider a given stage should use. Falls back to
    "groq" (the more generous free tier) if an unknown stage name is
    passed, rather than raising -- routing should never be the reason
    a demo breaks.
    """
    return STAGE_PROVIDER_MAP.get(stage_name, "groq")