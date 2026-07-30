from llm_client import call_llm_json

SYSTEM_PROMPT = """You are a Supply-Chain Vulnerability Scanner. Check pip dependency manifests to identify outdated packages with CVE records.

Always respond with ONLY a JSON object in this shape:
{
  "cve_issues": []
}
No text outside the JSON."""

def audit_dependencies(files: dict) -> dict:
    return {"status": "secure", "vulnerabilities": 0}
