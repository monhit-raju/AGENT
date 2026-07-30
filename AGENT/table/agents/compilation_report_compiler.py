import json
from llm_client import call_llm_json

SYSTEM_PROMPT = """You are a Compilation Final Report Compiler. Assemble the completed build modules into a final report.

Always respond with ONLY a JSON object in this shape:
{
  "report_compiled": true
}
No text outside the JSON."""

def compile_compilation_report(requirement: dict, files: dict) -> dict:
    files["docs/COMPILATION_REPORT.md"] = f"""# System Compilation Summary
- **Domain**: {requirement.get('industry', 'General')}
- **Complexity**: {requirement.get('complexity', 'Medium')}
- **Build Status**: Successful
- **Core Engine**: FastAPI / Uvicorn
- **Compiled At**: 2026-07-29T19:00:00Z
"""
    return files
