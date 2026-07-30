import json
import py_compile
import tempfile
import os
from llm_client import call_llm_json

LINT_HEALER_SYSTEM_PROMPT = """You are a software engineer specializing in python lint healing and format optimization.
Review the python code snippet and fix any obvious formatting, imports sorting, spacing, or minor syntax issues to make it clean, PEP-8 compliant, and fully executable.

Always respond in ONLY a JSON object in this exact shape:
{
  "healed_code": "the complete cleaned python file content"
}
No other text outside the JSON."""

def heal_code_style(file_path: str, code_content: str) -> str:
    # Quick syntax test to see if it even needs healing
    with tempfile.NamedTemporaryFile(suffix=".py", delete=False, mode="w", encoding="utf-8") as f:
        f.write(code_content)
        temp_name = f.name
    try:
        py_compile.compile(temp_name, doraise=True)
        # If it compiles fine, we can just do a light formatter LLM call or return as is.
        # Let's clean up temp file
        os.remove(temp_name)
    except Exception as e:
        # If it has syntax errors, invoke lint healer to fix them
        os.remove(temp_name)
        try:
            res = call_llm_json(
                system_prompt=LINT_HEALER_SYSTEM_PROMPT,
                user_prompt=f"File: {file_path}\nCode:\n{code_content}\nError:\n{str(e)}",
                provider="gemini",
                temperature=0.1
            )
            return res.get("healed_code", code_content)
        except Exception:
            return code_content

    # If already syntactically valid, return the original
    return code_content
