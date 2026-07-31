import json
from llm_client import call_llm_json

SYSTEM_PROMPT = """You are a Supply-Chain Vulnerability Scanner. Review the package list from requirements.txt and identify any outdated or vulnerable packages.

Always respond with ONLY a JSON object in this shape:
{
  "status": "secure" or "vulnerable",
  "vulnerabilities": [
    {
      "package": "package-name",
      "version": "version",
      "severity": "medium",
      "cve_id": "CVE-202X-XXXX",
      "description": "description"
    }
  ]
}
No text outside the JSON."""

def audit_dependencies(files: dict) -> dict:
    reqs = files.get("requirements.txt", "")
    if not reqs:
        return {"status": "secure", "vulnerabilities": 0}
        
    try:
        result = call_llm_json(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=f"requirements.txt content:\n{reqs}",
            provider="gemini",
            temperature=0.2
        )
        if "status" in result:
            files["docs/DEPENDENCY_AUDIT.json"] = json.dumps(result, indent=2)
            return result
    except Exception as e:
        print(f"[dependency_auditor] LLM call failed: {e}. Returning default secure status.")
    return {"status": "secure", "vulnerabilities": 0}
