# AgentForge Backend — Starter (Person 1: Orchestration)

## What's in here right now
- `llm_client.py` — the ONE function that talks to Groq. Every agent uses it.
- `agents/requirement_analysis.py` — Stage 1: understands what the user wants
- `agents/agent_planner.py` — Stage 2: picks which agents are needed
- `main.py` — the API server that ties it together

## Step-by-step: get this running (30-45 minutes)

### 1. Get your free API key
Go to https://console.groq.com → sign up (no credit card) → create an API key.

### 2. Set up your environment
```bash
cd agentforge-backend
python -m venv venv
source venv/bin/activate        # on Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```
Now open `.env` and paste your real Groq key in place of `your_groq_key_here`.

### 3. Test your key works
```bash
python llm_client.py
```
You should see `SUCCESS! Your Groq key works.` printed. If you get an error,
check that your key was pasted correctly into `.env` with no extra spaces.

### 4. Test Stage 1 alone
```bash
cd agents
python requirement_analysis.py
cd ..
```
This sends "Build me an AI customer support system" through Stage 1 and
prints the structured JSON it gets back. This is the moment you'll actually
understand what "an agent" means — it's just: prompt in, structured data out.

### 5. Test Stage 1 + Stage 2 together
```bash
cd agents
python agent_planner.py
cd ..
```
This chains both stages — you'll see the requirement JSON, then the list
of agents chosen for it.

### 6. Run it as a real API
```bash
uvicorn main:app --reload
```
Open http://127.0.0.1:8000/docs in your browser. Click on `POST /generate`,
click "Try it out", type a request like `{"user_input": "Build me an AI
recruitment platform"}`, and hit Execute. You'll see the full JSON response
— this is exactly what Person 3's frontend will receive.

## What YOU build next (in this order)
1. **Test and tighten Stage 1 and 2** — try 5-6 different user inputs, make
   sure the JSON always comes back clean. If it breaks on something, adjust
   the SYSTEM_PROMPT wording until it's reliable. This is 80% of "AI
   engineering" in practice — prompt, test, adjust, repeat.
2. **Add Stage 3: Workflow Designer** — new file `agents/workflow_designer.py`,
   same pattern as agent_planner.py: takes the agent list, outputs an
   ordered list of edges (which agent talks to which, in what order).
3. **Share the JSON output shape with Person 3 immediately** — don't wait
   until it's "done". They need to know the exact field names today so
   they can build the UI against it in parallel.
4. **Hand off to Person 2** — once Stage 1-3 are stable, Person 2 builds
   Stage 4 (Prompt Generator) and Stage 5-6 (Tool Selector, Code Generator)
   on top of your output, in the same `agents/` folder.

## Common issues
- **"JSON did not return valid JSON" error** — the model occasionally
  breaks format. The `response_format={"type": "json_object"}` in
  `llm_client.py` mostly prevents this, but if it still happens, lower
  `temperature` further or simplify the requested JSON shape.
- **Rate limit errors** — Groq's free tier is generous but not infinite.
  If you hit it while testing, wait a minute or switch to your Gemini
  backup key temporarily.
- **CORS errors from the frontend** — already handled in `main.py` via
  `CORSMiddleware`, but if you still see them, double check the frontend
  is calling `http://127.0.0.1:8000/generate` exactly.
