"""
Clarification Agent

Input:  the business_spec from Stage 1 (Requirement Analysis), specifically
        useful when confidence is "low"
Output: 2-4 targeted clarifying questions

This only runs when Stage 1 already flagged low confidence (via the
"confidence" and "assumptions" fields added earlier) -- it doesn't
run on every request, only the ones that actually need it. That keeps
the common case (clear input) fast and cheap, and only adds a
conversational round-trip when it's genuinely useful.
"""

from llm_client import call_llm_json

SYSTEM_PROMPT = """You are a Clarification Agent for a multi-agent
system generator. You are given a business_spec that was extracted from
a vague user request -- it includes assumptions the system had to guess.

Write 2-4 short, specific clarifying questions that would most reduce
ambiguity if answered. Focus on things that would meaningfully change
which agents get built or how the workflow is designed -- not
cosmetic details.

Good question style: "Should this support multiple companies (multi-tenant) or just one?"
Bad question style: "What features do you want?" (too vague, doesn't help)

Always respond with ONLY a JSON object in exactly this shape:
{
  "questions": ["question 1", "question 2", "question 3"]
}
No text outside the JSON."""


def generate_clarifying_questions(business_spec: dict) -> dict:
    return call_llm_json(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=f"Business spec with assumptions that need clarifying:\n{business_spec}",
    )


if __name__ == "__main__":
    # Manual test -- run from the AGENT root folder:
    #   python -m agents.clarification_agent
    from agents.requirement_analysis import analyze_requirement
    import json

    spec = analyze_requirement("AI system for education")  # deliberately vague
    print("Business spec:")
    print(json.dumps(spec, indent=2))

    questions = generate_clarifying_questions(spec)
    print("\nClarifying questions:")
    print(json.dumps(questions, indent=2))
