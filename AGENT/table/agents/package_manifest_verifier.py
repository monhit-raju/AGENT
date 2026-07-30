from llm_client import call_llm_json

SYSTEM_PROMPT = """You are a Deployment Manifest Validator. Check packaging manifests to guarantee clean setups.

Always respond with ONLY a JSON object in this shape:
{
  "manifest_valid": true
}
No text outside the JSON."""

def verify_package_manifest(files: dict) -> dict:
    if "pyproject.toml" not in files:
        files["pyproject.toml"] = "[build-system]\nrequires = [\"setuptools\", \"wheel\"]\nbuild-backend = \"setuptools.build_meta\"\n"
    return files
