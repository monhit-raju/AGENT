"""
STAGE 1: Requirement Analysis Agent

Input:  a plain English sentence from the user
Output: structured JSON describing what they actually need

This is the very first agent in the pipeline. Everything downstream
(Agent Planner, Workflow Designer, etc.) depends on this output being
clean and consistent, so keep the prompt strict about the JSON shape.
"""

from llm_client import call_llm_json

SYSTEM_PROMPT = """You are a Requirement Analysis Agent for a multi-agent
system generator. Given a user's plain-English request, extract the
underlying business requirement.

Before answering, think carefully about what the user actually needs:
- If the request is specific, extract the concrete tasks directly.
- If the request is vague or short (e.g. "AI system for education"),
  infer the MOST COMMON real-world interpretation of that domain, and
  be explicit in "assumptions" about what you filled in.
- Never leave key_tasks generic ("help users") -- always make them
  concrete and actionable, even when you had to infer them.

Always respond with ONLY a JSON object in exactly this shape:
{
  "domain": "short label, e.g. customer_support, recruitment, healthcare",
  "goal": "one sentence describing what the system should achieve",
  "key_tasks": ["list", "of", "3-6 concrete tasks the system must do"],
  "constraints": ["any limitations or requirements mentioned, or empty list"],
  "assumptions": ["anything you had to infer because the request was vague, or empty list if the request was already specific"],
  "confidence": "high, medium, or low -- how specific was the original request",
  "test_cases": [
    {
      "name": "a descriptive name for the first test case, e.g., 'Standard Customer Ticket'",
      "input_data": { "comment": "Add realistic key-value pairs matching what the system's first agent expects" }
    },
    {
      "name": "a descriptive name for the second test case, e.g., 'Spam or Vague Ticket'",
      "input_data": { "comment": "Add realistic key-value pairs" }
    }
  ]
}
No text outside the JSON. No markdown formatting."""


def analyze_requirement(user_input: str) -> dict:
    return call_llm_json(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=f'User request: "{user_input}"',
    )


if __name__ == "__main__":
    # Manual test -- run this file directly:  python agents/requirement_analysis.py
    test_input = "Build me an AI customer support system"
    result = analyze_requirement(test_input)
    print("Input: ", test_input)
    print("Output:")
    import json
    print(json.dumps(result, indent=2))