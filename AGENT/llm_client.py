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

_groq_client = None
_gemini_client = None


def _get_groq_client() -> Groq:
    global _groq_client
    if _groq_client is None:
        _groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
    return _groq_client


def _get_gemini_client() -> "genai.Client":
    global _gemini_client
    if _gemini_client is None:
        _gemini_client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
    return _gemini_client


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
    try:
        response = _get_groq_client().chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": safe_user_prompt},
            ],
            temperature=temperature,
            response_format={"type": "json_object"},
        )
    except Exception as e:
        print(f"[warning] Groq {GROQ_MODEL} failed ({e}), falling back to {GROQ_MODEL_FALLBACK}...")
        response = _get_groq_client().chat.completions.create(
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


def _call_gemini_json(system_prompt: str, user_prompt: str, temperature: float) -> dict:
    response = _get_gemini_client().models.generate_content(
        model=GEMINI_MODEL,
        contents=user_prompt,
        config=genai_types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=temperature,
            response_mime_type="application/json",
        ),
    )
    return json.loads(response.text)


_PROVIDER_FUNCS = {
    "groq": _call_groq_json,
    "gemini": _call_gemini_json,
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

    provider: "groq" (default, fast + reliable for most agents) or
              "gemini" (better for code generation quality).

    Resilience: the chosen provider gets one retry on any failure. If it
    still fails, this automatically tries the OTHER provider (also with
    one retry) before finally raising -- a single bad generation from
    either provider should never crash a request on its own.
    """
    other_provider = "gemini" if provider == "groq" else "groq"

    try:
        return _call_with_retry(provider, system_prompt, user_prompt, temperature)
    except Exception as primary_error:
        print(f"[fallback] {provider} failed after retry ({primary_error}), trying {other_provider}...")
        try:
            return _call_with_retry(other_provider, system_prompt, user_prompt, temperature)
        except Exception as fallback_error:
            raise ValueError(
                f"Both providers failed. {provider}: {primary_error} | {other_provider}: {fallback_error}"
            )


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