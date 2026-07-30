import os
import json
from google import genai
from google.genai import types as genai_types
from groq import Groq

def generate_ui(requirement: dict, plan: dict, workflow: dict, prompts: dict, tools: dict, generated_code: dict) -> str:
    """
    Synthesizes a responsive, custom-tailored frontend client interface for the end-user's application.
    Queries the LLM directly for raw HTML text, bypassing JSON escaping problems.
    """
    
    SYSTEM_PROMPT = """You are an expert Frontend Architect and UI/UX Designer.
Your task is to write a single, complete, premium-looking index.html file that serves as the end-user client interface for the generated multi-agent application.

Analyze the requirements spec, agent plans, and workflow topology to design a custom interface tailored to the application domain:
- Chatbots: sleek messaging windows with scrollable bubbles.
- Document summaries: rich text areas, parameters sliders, and markdown viewer panels.
- Scraping/Monitoring: indicator cards, status badges, and datatables.

DESIGN RULES:
- Style: Highly polished dark mode (slate-950/indigo-950), backdrop-blur glassmorphic panels, neon glows, clean margins.
- Typography: Outfit or Inter Google Fonts.
- Integrations: Include an inline <script>. It must POST to `/run` with body JSON `{"input_data": { ... }}` representing user inputs, and display the response output.
- Credentials Entry: Include a small, subtle settings gear/modal or input fields allowing users to configure their own Gemini API Key (`X-Gemini-Key`) and Groq API Key (`X-Groq-Key`). Save them in localStorage, and append them as request headers to `/run` fetch requests so the backend has access to keys if `.env` values are absent.
- Formatting: Return ONLY the raw HTML code, starting with <!DOCTYPE html> and ending with </html>. Do not wrap the code in markdown blocks like ```html or ```. Do not add any explanation or text before/after the code."""

    user_prompt = (
        f"Business Requirements:\n{json.dumps(requirement)}\n\n"
        f"Planned Agents:\n{json.dumps(plan)}\n\n"
        f"Workflow Map:\n{json.dumps(workflow)}\n\n"
        f"Backend Codebase Files:\n{json.dumps(list(generated_code.keys()))}"
    )

    def clean_text(text: str) -> str:
        text = text.strip()
        if text.startswith("```html"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        return text.strip()

    # 1. Try Gemini with key rotation
    from llm_client import get_gemini_keys, get_gemini_client, get_groq_keys, get_groq_client

    gemini_keys = get_gemini_keys()
    gemini_errors = []
    for key in gemini_keys:
        try:
            client = get_gemini_client(key)
            response = client.models.generate_content(
                model="gemini-3.5-flash",
                contents=user_prompt,
                config=genai_types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    temperature=0.3
                )
            )
            if response.text:
                return clean_text(response.text)
            raise ValueError("Empty response received from Gemini.")
        except Exception as e:
            key_suffix = str(key)[-4:] if key else "None"
            gemini_errors.append(f"Key ending ...{key_suffix}: {e}")
            print(f"[UI GENERATOR] Gemini generation failed with key ending in ...{key_suffix}: {e}. Trying next key...")

    # 2. Try Groq fallback with key rotation
    groq_keys = get_groq_keys()
    groq_errors = []
    for key in groq_keys:
        try:
            groq_client = get_groq_client(key)
            response = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3
            )
            content = response.choices[0].message.content
            if content:
                return clean_text(content)
            raise ValueError("Empty response received from Groq.")
        except Exception as ge:
            key_suffix = str(key)[-4:] if key else "None"
            groq_errors.append(f"Key ending ...{key_suffix}: {ge}")
            print(f"[UI GENERATOR] Groq generation failed with key ending in ...{key_suffix}: {ge}. Trying next key...")

    # 2.5. Try OpenRouter fallback with key rotation
    from llm_client import get_openrouter_keys
    or_keys = get_openrouter_keys()
    or_errors = []
    if or_keys:
        import urllib.request
        url = "https://openrouter.ai/api/v1/chat/completions"
        model = os.environ.get("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct")
        for key in or_keys:
            try:
                headers = {
                    "Authorization": f"Bearer {key}",
                    "Content-Type": "application/json",
                }
                data = {
                    "model": model,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt}
                    ],
                    "temperature": 0.3
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
                    if content:
                        return clean_text(content)
                raise ValueError("Empty response received from OpenRouter.")
            except Exception as oe:
                key_suffix = str(key)[-4:] if key else "None"
                or_errors.append(f"Key ending ...{key_suffix}: {oe}")
                print(f"[UI GENERATOR] OpenRouter generation failed with key ending in ...{key_suffix}: {oe}. Trying next key...")

    print(f"[UI GENERATOR ERROR] Gemini, Groq, and OpenRouter generation failed. Gemini errors: {gemini_errors} | Groq errors: {groq_errors} | OpenRouter errors: {or_errors}")
    # 3. Fallback standard client page
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AgentForge Client Interface</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        body {{
            background: radial-gradient(circle at top, #0f172a, #020617);
            color: #f8fafc;
            font-family: 'Inter', sans-serif;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            overflow: hidden;
        }}
        .card {{
            background: rgba(15, 23, 42, 0.4);
            border: 1px solid rgba(56, 189, 248, 0.1);
            backdrop-filter: blur(12px);
            border-radius: 24px;
            padding: 40px;
            text-align: center;
            max-width: 480px;
            box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
        }}
        h1 {{
            font-size: 24px;
            margin-bottom: 8px;
            color: #38bdf8;
        }}
        p {{
            color: #94a3b8;
            font-size: 14px;
            line-height: 1.6;
        }}
        button {{
            margin-top: 24px;
            background: #0284c7;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }}
        button:hover {{
            background: #0369a1;
            transform: translateY(-2px);
        }}
    </style>
</head>
<body>
    <div class="card">
        <h1>System Generated Successfully</h1>
        <p>Your multi-agent backend is running. You can interact with the agent endpoints directly using API clients or refine the frontend using the Copilot panel.</p>
        <button onclick="window.open('/docs')">View API Docs</button>
    </div>
</body>
</html>"""
