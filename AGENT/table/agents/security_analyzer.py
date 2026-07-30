import json
from llm_client import call_llm_json

SECURITY_ANALYSER_SYSTEM_PROMPT = """You are an expert Security Engineer specializing in Python static application security testing (SAST).
Analyze the generated Python codebase files for security vulnerabilities (e.g. hardcoded API keys, shell injections, unsafe eval calls).

Always respond in ONLY a JSON object in this exact shape:
{
  "issues_found": [
    {
      "severity": "high" or "medium" or "low",
      "file": "path/to/file",
      "description": "details of vulnerability",
      "remediation": "suggested fix description"
    }
  ],
  "security_score_out_of_100": 85
}
No other text outside the JSON."""

def analyze_security(requirement: dict, agent_plan: dict, generated_code: dict) -> dict:
    files_summary = {path: content[:1200] for path, content in generated_code.items() if path.endswith(".py")}
    user_prompt = (
        f"Business Spec:\n{json.dumps(requirement)}\n\n"
        f"Agent Plan:\n{json.dumps(agent_plan)}\n\n"
        f"Codebase:\n{json.dumps(files_summary)}"
    )
    return call_llm_json(
        system_prompt=SECURITY_ANALYSER_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        provider="gemini",
        temperature=0.2
    )
