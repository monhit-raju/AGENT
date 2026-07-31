import json
from llm_client import call_llm_json

SYSTEM_PROMPT = """You are a UI Accessibility and Layout Inspector. Audit the frontend HTML file (static/index.html) to verify styling ( Tailwind/CSS classes), UI responsiveness, accessibility tags, layout structure, and fix any layout issues or visual gaps.

Always respond in ONLY a JSON object in this exact shape:
{
  "html_content": "the updated complete index.html content"
}
No text outside the JSON."""

def review_ui_components(files: dict) -> dict:
    ui_content = files.get("static/index.html", "")
    if not ui_content:
        return files
        
    try:
        result = call_llm_json(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=f"UI Content:\n{ui_content}",
            provider="gemini",
            temperature=0.2
        )
        if "html_content" in result and result["html_content"]:
            files["static/index.html"] = result["html_content"]
    except Exception as e:
        print(f"[ui_reviewer] LLM call failed: {e}. Keeping original UI components.")
    return files
