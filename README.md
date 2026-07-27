# AgentForge

AgentForge is an AI-powered system builder that turns a plain-English idea into a structured multi-agent architecture, workflow, prompts, tool recommendations, and starter code. The repo now contains both a FastAPI backend and a React/Vite frontend for a more complete end-to-end experience.

## What this project does

- Accepts a user prompt and analyzes the business context
- Generates a multi-agent architecture and workflow plan
- Creates prompts, tool suggestions, and starter code assets
- Supports clarification when the initial request is vague
- Provides a modern UI with Build, Output, Settings, and About tabs

## Project structure

```text
Agentverse/
├── AGENT/                      # FastAPI backend + agent pipeline
│   ├── main.py
│   ├── llm_client.py
│   ├── requirements.txt
│   └── table/
│       ├── agents/
│       └── schemas/
├── agentforge-frontend/        # React + Vite UI
│   ├── src/
│   ├── package.json
│   └── vite.config.*
└── .gitignore
```

## Backend overview

The backend lives in the AGENT folder and includes:

- FastAPI server in AGENT/main.py
- LLM wrapper in AGENT/llm_client.py
- pipeline stages under AGENT/table/agents/
- shared schemas under AGENT/table/schemas/

## Frontend overview

The frontend lives in agentforge-frontend and provides:

- a prompt input experience
- a multi-tab workspace layout
- API settings for custom base URLs and API keys
- an output panel for viewing backend responses and errors

## How the pipeline works

1. Business Understanding extracts the domain, goal, tasks, constraints, assumptions, and a confidence score from the user’s prompt.
2. If confidence is low, the Clarification Agent asks a few follow-up questions instead of guessing.
3. If confidence is acceptable, the pipeline continues through the planner, workflow designer, validation step, prompt generator, tool selector, and code generator.
4. The final result is assembled into a structured response that the UI can render.

## API endpoints

- POST /generate
  - sends a user prompt and starts the generation flow
- POST /generate/continue
  - continues the flow after clarification answers are collected
- GET /download-project
  - downloads a generated project archive

## Setup

### 1. Backend

```bash
cd AGENT
python -m venv .venv
.venv\Scripts\activate       # Windows
pip install -r requirements.txt
```

Create a .env file with your keys and run the backend:

```bash
python -m uvicorn main:app --reload
```

Open:

- http://127.0.0.1:8000/docs

### 2. Frontend

```bash
cd agentforge-frontend
npm install
npm run dev
```

Open the local frontend URL, usually:

- http://localhost:5173

In the Settings tab, set the API base URL to:

- http://127.0.0.1:8000

## Environment variables

The backend expects API keys and provider settings in a .env file. Keep this file local and never commit real secrets.

## Common issues

- If you see a module import error, run the backend using the correct package context.
- If the frontend cannot reach the backend, confirm that the backend server is running and the API base URL is correct.
- If you use an API key in the browser UI, remember that local demo usage is fine but production deployments should keep secrets on the server side.

## Future improvements

Possible next steps for this project include:

- user accounts and saved agents
- per-agent API key management
- richer agent execution history
- streaming output for long-running generations
- more advanced workflow and deployment generation
