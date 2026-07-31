"""
This is the ONE place that talks to LLMs.
Every agent (Requirement Analysis, Agent Planner, etc.) calls the function
below instead of calling a provider's SDK directly. That way, if you ever
need to switch providers or add a fallback, you change it in ONE place.

Two providers are wired up:
- Groq  -- fast + very generous free tier, used as the DEFAULT for most
           agents (structured reasoning: analysis, planning, workflow).
- Gemini -- used specifically for CODE GENERATION (Stage 6), since it
            tends to produce cleaner, more idiomatic code than small
            fast models.

RELIABILITY (v2): earlier versions only had ONE-WAY fallback (Gemini
failing would fall back to Groq, but not vice versa). A real failure
proved that wasn't enough: Groq occasionally generates malformed JSON
on its own (a bracket mismatch, etc.) for large/complex schemas, and
Groq's server rejects its own broken output with a 400 BadRequestError
-- a different exception type than a JSON parse failure, so the old
code didn't catch it and it crashed the whole request.

Now: (1) each provider gets ONE retry on ANY failure -- most malformed-
JSON failures are one-off sampling flukes that succeed on a second try,
and (2) if a provider still fails after its retry, this falls back to
the OTHER provider automatically, regardless of which one was primary.
Both directions are covered now, not just Gemini-to-Groq.
"""

import os
import json
import time
from dotenv import load_dotenv
from groq import Groq
from google import genai
from google.genai import types as genai_types

load_dotenv()  # reads the .env file and loads GROQ_API_KEY / GEMINI_API_KEY

GROQ_MODEL = "llama-3.3-70b-versatile"
GROQ_MODEL_FALLBACK = "llama-3.1-8b-instant"

GEMINI_MODEL = "gemini-3.5-flash"
GEMINI_MODEL_FALLBACK = "gemini-2.0-flash"

_groq_clients = {}
_gemini_clients = {}


def get_groq_client(api_key: str = None) -> Groq:
    if api_key not in _groq_clients:
        _groq_clients[api_key] = Groq(api_key=api_key)
    return _groq_clients[api_key]


def get_gemini_client(api_key: str = None) -> "genai.Client":
    if api_key not in _gemini_clients:
        _gemini_clients[api_key] = genai.Client(api_key=api_key)
    return _gemini_clients[api_key]


def get_gemini_keys() -> list:
    val = os.environ.get("GEMINI_API_KEY", "")
    keys = [k.strip() for k in val.split(",") if k.strip()]
    return keys if keys else [None]


def get_groq_keys() -> list:
    val = os.environ.get("GROQ_API_KEY", "")
    keys = [k.strip() for k in val.split(",") if k.strip()]
    return keys if keys else [None]


def get_openrouter_keys() -> list:
    val = os.environ.get("OPENROUTER_API_KEY", "")
    keys = [k.strip() for k in val.split(",") if k.strip()]
    return keys if keys else []


def get_openai_keys() -> list:
    val = os.environ.get("OPENAI_API_KEY", "")
    keys = [k.strip() for k in val.split(",") if k.strip()]
    return keys if keys else []


def _clean_json_text(text: str) -> str:
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


def _call_openrouter_json(system_prompt: str, user_prompt: str, temperature: float) -> dict:
    import urllib.request

    keys = get_openrouter_keys()
    if not keys:
        raise ValueError("No OpenRouter API keys found.")

    last_err = None
    url = "https://openrouter.ai/api/v1/chat/completions"
    model = os.environ.get("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct")

    for key in keys:
        try:
            headers = {
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
            }

            data = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": temperature,
                "response_format": {"type": "json_object"}
            }

            req = urllib.request.Request(
                url,
                data=json.dumps(data).encode("utf-8"),
                headers=headers,
                method="POST"
            )

            with urllib.request.urlopen(req, timeout=30) as response:
                res_body = response.read().decode("utf-8")
                res_json = json.loads(res_body)
                content = res_json["choices"][0]["message"]["content"]
                try:
                    return json.loads(content)
                except Exception:
                    return json.loads(_clean_json_text(content))
        except Exception as e:
            last_err = e
            key_suffix = str(key)[-4:] if key else "None"
            print(f"[warning] OpenRouter call failed with key ending in ...{key_suffix} ({e}). Trying next key...")

    raise last_err


def _ensure_json_keyword(system_prompt: str, user_prompt: str) -> str:
    """
    Groq's API requires the literal word 'json' to appear somewhere in
    the messages whenever response_format={"type": "json_object"} is
    used, or it rejects the request with a 400 error. Enforced here
    once so every call is safe regardless of what any prompt says.
    """
    combined = f"{system_prompt} {user_prompt}".lower()
    if "json" not in combined:
        return f"{user_prompt}\n\nRespond only with valid JSON."
    return user_prompt


def _call_groq_json(system_prompt: str, user_prompt: str, temperature: float) -> dict:
    safe_user_prompt = _ensure_json_keyword(system_prompt, user_prompt)
    keys = get_groq_keys()
    last_err = None
    for key in keys:
        try:
            client = get_groq_client(key)
        except Exception as e:
            last_err = e
            key_suffix = str(key)[-4:] if key else "None"
            print(f"[warning] Groq client initialization failed with key ending in ...{key_suffix} ({e}). Trying next key...")
            continue

        key_suffix = str(key)[-4:] if key else "None"
        try:
            response = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": safe_user_prompt},
                ],
                temperature=temperature,
                response_format={"type": "json_object"},
            )
            raw_text = response.choices[0].message.content
            return json.loads(raw_text)
        except Exception as e:
            last_err = e
            print(f"[warning] Groq {GROQ_MODEL} failed with key ending in ...{key_suffix} ({e}), trying fallback {GROQ_MODEL_FALLBACK} with same key...")
            try:
                response = client.chat.completions.create(
                    model=GROQ_MODEL_FALLBACK,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": safe_user_prompt},
                    ],
                    temperature=temperature,
                    response_format={"type": "json_object"},
                )
                raw_text = response.choices[0].message.content
                return json.loads(raw_text)
            except Exception as fe:
                print(f"[warning] Groq fallback {GROQ_MODEL_FALLBACK} also failed with key ending in ...{key_suffix} ({fe}). Trying next key...")
                last_err = fe
    raise last_err


def _call_gemini_json(system_prompt: str, user_prompt: str, temperature: float) -> dict:
    keys = get_gemini_keys()
    last_err = None
    for key in keys:
        try:
            client = get_gemini_client(key)
        except Exception as e:
            last_err = e
            key_suffix = str(key)[-4:] if key else "None"
            print(f"[warning] Gemini client initialization failed with key ending in ...{key_suffix} ({e}). Trying next key...")
            continue

        key_suffix = str(key)[-4:] if key else "None"
        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=user_prompt,
                config=genai_types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=temperature,
                    response_mime_type="application/json",
                ),
            )
            return json.loads(response.text)
        except Exception as e:
            last_err = e
            print(f"[warning] Gemini {GEMINI_MODEL} failed with key ending in ...{key_suffix} ({e}), trying fallback {GEMINI_MODEL_FALLBACK} with same key...")
            try:
                response = client.models.generate_content(
                    model=GEMINI_MODEL_FALLBACK,
                    contents=user_prompt,
                    config=genai_types.GenerateContentConfig(
                        system_instruction=system_prompt,
                        temperature=temperature,
                        response_mime_type="application/json",
                    ),
                )
                return json.loads(response.text)
            except Exception as fe:
                print(f"[warning] Gemini fallback {GEMINI_MODEL_FALLBACK} also failed with key ending in ...{key_suffix} ({fe}). Trying next key...")
                last_err = fe
    raise last_err


def _call_openai_json(system_prompt: str, user_prompt: str, temperature: float) -> dict:
    import urllib.request
    keys = get_openai_keys()
    if not keys:
        raise ValueError("No OpenAI API keys found in OPENAI_API_KEY environment variable.")

    last_err = None
    url = "https://api.openai.com/v1/chat/completions"
    model = os.environ.get("OPENAI_MODEL", "gpt-4o")

    for key in keys:
        try:
            headers = {
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
            }

            data = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": temperature,
                "response_format": {"type": "json_object"}
            }

            req = urllib.request.Request(
                url,
                data=json.dumps(data).encode("utf-8"),
                headers=headers,
                method="POST"
            )

            with urllib.request.urlopen(req, timeout=30) as response:
                res_body = response.read().decode("utf-8")
                res_json = json.loads(res_body)
                content = res_json["choices"][0]["message"]["content"]
                try:
                    return json.loads(content)
                except Exception:
                    return json.loads(_clean_json_text(content))
        except Exception as e:
            last_err = e
            key_suffix = str(key)[-4:] if key else "None"
            print(f"[warning] OpenAI call failed with key ending in ...{key_suffix} ({e}). Trying next key...")

    raise last_err


_PROVIDER_FUNCS = {
    "groq": _call_groq_json,
    "gemini": _call_gemini_json,
    "openai": _call_openai_json,
}


def _call_with_retry(provider: str, system_prompt: str, user_prompt: str, temperature: float, retries: int = 1):
    """
    Calls one provider, retrying on ANY failure (bad JSON, malformed
    generation, transient API error) up to `retries` extra times before
    giving up and raising. Most single-shot generation glitches --
    including the exact bracket-mismatch failure this was built to fix
    -- succeed on a second attempt, since it's non-deterministic
    sampling, not a deterministic bug.
    """
    func = _PROVIDER_FUNCS[provider]
    last_error = None
    for attempt in range(retries + 1):
        try:
            return func(system_prompt, user_prompt, temperature)
        except Exception as e:
            last_error = e
            if attempt < retries:
                print(f"[retry] {provider} attempt {attempt + 1} failed ({e}), retrying...")
                time.sleep(0.5)
    raise last_error


def call_llm_json(system_prompt: str, user_prompt: str, provider: str = "groq", temperature: float = 0.3) -> dict:
    """
    Sends a system prompt + user prompt to an LLM and asks it to reply
    with ONLY valid JSON. Returns that JSON as a Python dict.

    provider: "groq" (default, fast + reliable for most agents),
              "gemini" (better for code generation quality), or
              "openai" (official OpenAI GPT-4o / Codex API).

    Resilience: cascading fallback across all configured providers.
    """
    providers_order = ["openai", "gemini", "groq"]
    if provider in providers_order:
        providers_order.remove(provider)
        providers_order.insert(0, provider)

    # Determine which providers have keys configured
    available_providers = []
    for p in providers_order:
        if p == "openai" and get_openai_keys():
            available_providers.append(p)
        elif p == "gemini" and get_gemini_keys() != [None]:
            available_providers.append(p)
        elif p == "groq" and get_groq_keys() != [None]:
            available_providers.append(p)

    if not available_providers:
        # If no custom keys are configured in env, fallback to default behavior
        available_providers = [provider, "gemini" if provider == "groq" else "groq"]

    errors = []
    for p in available_providers:
        try:
            return _call_with_retry(p, system_prompt, user_prompt, temperature)
        except Exception as e:
            print(f"[fallback] {p} failed after retry ({e}), trying next provider...")
            errors.append(f"{p}: {str(e)}")

    # If all standard providers failed, try OpenRouter as a final fallback
    if get_openrouter_keys():
        print(f"[fallback] All standard providers failed. Trying OpenRouter fallback...")
        try:
            return _call_openrouter_json(system_prompt, user_prompt, temperature)
        except Exception as or_error:
            errors.append(f"OpenRouter: {str(or_error)}")
            raise ValueError(f"All providers failed. Details:\n" + "\n".join(errors))
    else:
        raise ValueError(f"Both standard providers failed. Details:\n" + "\n".join(errors))


if __name__ == "__main__":
    result = call_llm_json(
        system_prompt="You are a helpful assistant. Always reply in JSON.",
        user_prompt='Reply with JSON like {"status": "ok", "message": "..."} confirming you received this.',
        provider="groq",
    )
    print("SUCCESS! Your Groq key works. Response:")
    print(result)

    result2 = call_llm_json(
        system_prompt="You are a helpful assistant. Always reply in JSON.",
        user_prompt='Reply with JSON like {"status": "ok", "message": "..."} confirming you received this.',
        provider="gemini",
    )
    print("\nSUCCESS! Your Gemini key works (or fell back to Groq cleanly). Response:")
    print(result2)