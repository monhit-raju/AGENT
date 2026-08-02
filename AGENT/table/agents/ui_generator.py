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
    
    SYSTEM_PROMPT = """You are a master Frontend Architect and a world-class UI/UX Designer.
Your task is to write a single, complete, premium-grade HTML5 file (index.html) that serves as the end-user client interface for the generated multi-agent application.
This page must feel state-of-the-art, highly professional, responsive, and aesthetically stunning (WOW factor).

Analyze the requirements spec, agent plans, and workflow topology to design a custom interface tailored to the application domain:
- Chat/Conversational agents: A premium messaging canvas with typing indicators, user/agent avatar icons, scroll-locked message feeds, and quick-reply action chips.
- Analytics/Monitoring: Beautiful grid panels with KPI cards, metrics with green/cyan glows, dynamic data tables, and interactive status badges.
- Creative/Document Generation: A split-screen layout with form inputs/sliders on the left, and a beautiful document viewer card with copy-to-clipboard actions on the right.

CRITICAL DESIGN & AESTHETIC RULES:
1. Styling & Theme: Use a highly curated dark mode. Background should be deep space/slate (e.g., `background: radial-gradient(circle at 50% 0%, #0B0F19, #05070C)`). Accents should use neon cyber colors (neon cyan `#00F0FF`, royal purple `#8B5CF6`, emerald `#10B981` for success states). Use backdrop-blur glassmorphic panels, neon borders, and spacious margins.
2. Layout Structure:
   - Header: Premium header bar with application logo icon, pulsing status dot indicating "Agents Online", and a Settings Gear.
   - Main Grid: A responsive two-column or grid layout separating the Control Inputs panel from the Output Viewer.
   - Agent Status Tracker: Render a sidebar or drawer listing the agents involved in the workflow (e.g., Planner, Auditor, Writer) with custom tags, capabilities, and execution indicators.
   - Settings Modal: A hidden modal toggled by the Settings Gear allowing users to configure their own Gemini (`X-Gemini-Key`), Groq (`X-Groq-Key`), and OpenAI (`X-OpenAI-Key`) keys. Securely store them in localStorage and display masked fields.
3. Micro-Animations & Hover Effects:
   - Inputs/Buttons: Elegant border transitions on focus/hover (`transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)`).
   - Glow effects: Subtle box-shadow glows on primary active cards and buttons.
   - Loading State: Animate a pulsing loading spinner or glowing status track when a query is running.
4. Typography & Icons:
   - Use 'Outfit' or 'Plus Jakarta Sans' via Google Fonts for headings and body.
   - Include Tailwind CSS CDN (`https://cdn.tailwindcss.com`) and Lucide Icons CDN (`https://unpkg.com/lucide@latest`) for clean styling and icons.

FUNCTIONAL RULES:
- Include an inline <script> block.
- It must POST to `/run` with body JSON `{"input_data": { ... }}` representing user inputs, and display the response output in the preview panel.
- Retrieve the keys (Gemini, Groq, OpenAI) from localStorage and append them as request headers (`X-Gemini-Key`, `X-Groq-Key`, `X-OpenAI-Key`) to the `/run` fetch request.
- Handle error responses gracefully, displaying user-friendly error callouts.

Formatting: Return ONLY the raw HTML code, starting with <!DOCTYPE html> and ending with </html>. Do not wrap the code in markdown blocks like ```html or ```. Do not add any explanation or text before/after the code."""

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
    <title>AgentForge Workspace Dashboard</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        body {{
            background: radial-gradient(circle at 50% 0%, #0B0F19, #05070C);
            color: #f8fafc;
            font-family: 'Outfit', sans-serif;
            min-height: 100vh;
        }}
        .glass-panel {{
            background: rgba(15, 23, 42, 0.45);
            border: 1px solid rgba(139, 92, 246, 0.15);
            backdrop-filter: blur(16px);
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }}
        .neon-glow {{
            text-shadow: 0 0 10px rgba(0, 240, 255, 0.5), 0 0 20px rgba(0, 240, 255, 0.2);
        }}
    </style>
</head>
<body class="flex items-center justify-center p-6">
    <div class="glass-panel max-w-lg w-full rounded-[2rem] p-8 text-center space-y-6 relative overflow-hidden">
        <!-- Accent Glows -->
        <div class="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-600/10 rounded-full blur-3xl"></div>

        <div class="inline-flex items-center justify-center p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20 text-purple-400 mb-2">
            <i data-lucide="check-circle" class="w-8 h-8"></i>
        </div>

        <div class="space-y-2">
            <span class="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold neon-glow">Compilation Complete</span>
            <h1 class="text-2xl font-bold text-white tracking-tight">AgentForge System Generated</h1>
            <p class="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                Your multi-agent system backend is successfully running. You can query endpoints via the API documentation, or use the Settings panel to configure authorization headers.
            </p>
        </div>

        <div class="flex flex-col gap-2 pt-2">
            <button onclick="window.open('/docs')" class="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25">
                <i data-lucide="external-link" class="w-4 h-4"></i>
                Open Interactive API Docs
            </button>
            <button onclick="location.reload()" class="w-full py-3 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900 text-slate-300 font-bold text-sm transition-all flex items-center justify-center gap-2">
                <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                Refresh Live Client
            </button>
        </div>
    </div>
    <script>
        lucide.createIcons();
    </script>
</body>
</html>"""
