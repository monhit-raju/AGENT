from llm_client import call_llm_json

SYSTEM_PROMPT = """You are a Performance Bottleneck Analyzer. Inspect logic modules to identify CPU-intensive loops or redundant query requests.

Always respond with ONLY a JSON object in this shape:
{
  "performance_score": 100
}
No text outside the JSON."""

def analyze_performance(files: dict) -> dict:
    return {"complexity": "low", "recommendations": []}
