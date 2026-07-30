from llm_client import call_llm_json

SYSTEM_PROMPT = """You are a UI Accessibility and Layout Inspector. Audit frontend templates to verify syntax layout and mobile responsiveness.

Always respond with ONLY a JSON object in this shape:
{
  "layout_validated": true
}
No text outside the JSON."""

def review_ui_components(files: dict) -> dict:
    return files
