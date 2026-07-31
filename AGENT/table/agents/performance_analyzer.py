import json
from llm_client import call_llm_json

SYSTEM_PROMPT = """You are a Performance Bottleneck Analyzer. Review the generated Python codebase files to identify potential latency bottlenecks, CPU-intensive loops, or redundant SQL queries.

Always respond with ONLY a JSON object in this shape:
{
  "performance_score_out_of_100": 95,
  "complexity": "low" or "medium" or "high",
  "bottlenecks": [
    {
      "file": "path/to/file",
      "issue": "description of performance issue",
      "recommendation": "remediation steps"
    }
  ]
}
No text outside the JSON."""

def analyze_performance(files: dict) -> dict:
    files_summary = {path: content[:1500] for path, content in files.items() if path.endswith(".py")}
    try:
        result = call_llm_json(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=f"Codebase files content:\n{json.dumps(files_summary)}",
            provider="gemini",
            temperature=0.2
        )
        if "performance_score_out_of_100" in result:
            files["docs/PERFORMANCE_REPORT.json"] = json.dumps(result, indent=2)
            return result
    except Exception as e:
        print(f"[performance_analyzer] LLM call failed: {e}. Returning default performance score.")
    return {"complexity": "low", "recommendations": []}
