# AgentForge Backend

An AI-powered multi-agent system generator. Describe what you need in
plain English, get back a designed architecture, a workflow diagram,
system prompts, tool recommendations, and a real downloadable project.

## Current status

All 6 core pipeline stages are built and tested, plus a validation
layer, a multi-turn clarification flow for vague inputs, and a formal
LLM routing table. This README reflects the project as it stands now —
see "Project history" at the bottom if you want the original day-1
starter instructions.

## Folder structure

```
agentforge-backend/
├── .env / .env.example      # API keys (never commit the real .env)
├── requirements.txt
├── main.py                  # API server, orchestrates every stage
├── llm_client.py            # Groq + Gemini clients, automatic failover
│
├── router/
│   └── llm_router.py        # explicit stage -> provider routing table
│
├── schemas/
│   └── project_context.py   # ProjectContext: the shared result object
│
├── validators/
│   └── workflow_validator.py # structural validation (deterministic, no LLM)
│
└── agents/
    ├── requirement_analysis.py   # Stage 1: business understanding
    ├── clarification_agent.py    # asks follow-up questions if confidence is low
    ├── agent_planner.py          # Stage 2: picks agents from the library
    ├── workflow_designer.py      # Stage 3: builds the node/edge graph
    ├── prompt_generator.py       # Stage 4: writes each agent's system prompt
    ├── tool_selector.py          # Stage 5: recommends free-tier tools/stack
    └── code_generator.py         # Stage 6: writes + self-heals real code
```

## How the pipeline works

1. **Business Understanding** (Stage 1) extracts domain, goal, tasks,
   constraints, assumptions, and a confidence score from the user's
   plain-English input.
2. **Confidence check** — if confidence is `"low"`, the pipeline stops
   and the **Clarification Agent** generates 2-4 targeted follow-up
   questions instead of guessing. The frontend collects answers and
   calls `/generate/continue`, which merges them into a richer input
   and re-runs the pipeline.
3. If confidence is fine, the full pipeline runs:
   **Agent Planner** (Stage 2) → **Workflow Designer** (Stage 3) →
   **Validation** (deterministic structural check, not an LLM call) →
   **Prompt Generator** (Stage 4) → **Tool Selector** (Stage 5) →
   **Code Generator** (Stage 6, with self-healing: broken agent files
   get auto-repaired or replaced with a guaranteed-valid stub).
4. Everything is assembled into one `ProjectContext` object and
   returned as JSON.

## LLM routing

Each stage uses whichever provider fits best, with automatic failover
if that provider errors out (see `router/llm_router.py` for the table
and `llm_client.py` for the failover logic):

| Stage | Provider | Why |
|---|---|---|
| Business Understanding, Agent Planner, Tool Selector | Groq | fast, structured reasoning |
| Workflow Designer | Groq | fast, structured reasoning |
| Prompt Generator, Code Generator | Gemini (falls back to Groq) | stronger generation quality |

## API endpoints

- `POST /generate` — `{"user_input": "..."}` → runs Stage 1; either
  returns `{"status": "needs_clarification", "questions": [...]}` or
  runs the full pipeline and returns `{"status": "complete", ...}`.
- `POST /generate/continue` — `{"user_input": "...", "answers": [{"question": "...", "answer": "..."}]}`
  → merges answers into the input and runs the full pipeline.
- `GET /download-project?user_input=...` — runs the full pipeline
  directly (skips clarification) and returns a downloadable `.zip` of
  the generated project.

## Setup (5-10 minutes)

### 1. Get your free API keys
- Groq: https://console.groq.com (no credit card)
- Gemini: https://aistudio.google.com (no credit card)

### 2. Environment
```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```
Paste both real keys into `.env`.

### 3. Sanity-check both providers
```bash
python llm_client.py
```
Should print `SUCCESS!` for both Groq and Gemini.

### 4. Test individual stages
Run any agent file directly with `-m`, from this root folder:
```bash
python -m agents.requirement_analysis
python -m agents.clarification_agent
python -m agents.agent_planner
python -m agents.workflow_designer
python -m validators.workflow_validator
python -m agents.prompt_generator
python -m agents.tool_selector
python -m agents.code_generator
```

### 5. Run the API
```bash
python -m uvicorn main:app --reload
```
Open http://127.0.0.1:8000/docs to test every endpoint interactively.

## Common issues

- **`ModuleNotFoundError` when running a file inside `agents/` directly**
  — always run with `python -m agents.<filename>` from this root
  folder, never `python agents/<filename>.py` or from inside the
  folder. Every internal import uses the full `agents.` / `router.` /
  `schemas.` / `validators.` path to match this.
- **`Fatal error in launcher` on `uvicorn`** — use
  `python -m uvicorn main:app --reload` instead of the bare `uvicorn`
  command; this avoids a broken Windows launcher shortcut.
- **Gemini 404 "model no longer available"** — Google retires model
  versions faster than expected sometimes; check `GEMINI_MODEL` in
  `llm_client.py` is set to a currently supported model name.
- **Rate limit errors** — both providers have generous but not
  infinite free tiers. The Gemini→Groq failover in `llm_client.py`
  handles this automatically for most stages.
- **CORS errors from the frontend** — already handled via
  `CORSMiddleware` in `main.py`; double-check the frontend is calling
  `http://127.0.0.1:8000` exactly.

## What's intentionally not built (and why)

A few production-grade ideas were considered and deliberately deferred
to keep this shippable within a hackathon timeline: a separate
Capability Planner stage, an Agent Architect stage distinct from Agent
Planner, modular per-target code generators (separate Backend/
Frontend/Database/Docker generators instead of one Code Generator),
a full documentation generator, and a LangGraph/async/dependency-
injection rewrite of the whole backend. These are good v2 roadmap
items, not gaps — see the pitch deck for how they'd extend this
architecture.

