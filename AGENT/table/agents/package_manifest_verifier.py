import json
from llm_client import call_llm_json

SYSTEM_PROMPT = """You are a Deployment Manifest Validator. Review the package files structure and requirement, then write a custom, complete pyproject.toml package manifest file.

Always respond with ONLY a JSON object in this shape:
{
  "pyproject_content": "the complete content of pyproject.toml as a string"
}
No text outside the JSON."""

def verify_package_manifest(files: dict) -> dict:
    try:
        result = call_llm_json(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=f"Files structure:\n{list(files.keys())}",
            provider="gemini",
            temperature=0.2
        )
        if "pyproject_content" in result and result["pyproject_content"]:
            files["pyproject.toml"] = result["pyproject_content"]
            return files
    except Exception as e:
        print(f"[manifest_verifier] LLM call failed: {e}. Using fallback manifest.")
    if "pyproject.toml" not in files:
        files["pyproject.toml"] = "[build-system]\nrequires = [\"setuptools\", \"wheel\"]\nbuild-backend = \"setuptools.build_meta\"\n"
    return files
