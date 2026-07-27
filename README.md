# AgentForge

AgentForge is an AI-powered system builder that turns a plain-English idea into a structured multi-agent architecture, workflow, prompts, tool recommendations, and starter code. The project now includes both a FastAPI backend and a polished React/Vite frontend.

## What it does

- Accepts a user prompt and analyzes the business context
- Generates a multi-agent architecture and workflow plan
- Creates prompts, tool suggestions, and starter code assets
- Supports clarification when the initial request is vague
- Exposes a modern UI with Build, Output, Settings, and About tabs

## Project structure

```text
Agentverse/
├── AGENT/                      # FastAPI backend + agent pipeline
│   ├── main.py
│   ├── llm_client.py
│   ├── requirements.txt
│   ├── table/agents/           # pipeline stages
│   └── table/schemas/
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

## Quick start

### 1. Backend setup

```bash
cd AGENT
python -m venv .venv
.venv\Scripts\activate       # Windows
pip install -r requirements.txt
```

Create an environment file with your API keys:

```bash
copy .env.example .env
```

Then add your provider keys to the .env file.

Run the backend:

```bash
python -m uvicorn main:app --reload
```

The API should be available at:

- http://127.0.0.1:8000/docs

### 2. Frontend setup

```bash
cd agentforge-frontend
npm install
npm run dev
```

Open the local frontend URL, usually:

- http://localhost:5173

In the Settings tab, set the API base URL to:

- http://127.0.0.1:8000

## API endpoints

- POST /generate
  - sends a user prompt and starts the generation flow
- POST /generate/continue
  - continues the flow after clarification answers are collected
- GET /download-project
  - downloads a generated project archive

## Environment variables

The backend expects API keys and provider settings in a .env file. Keep this file local and never commit real secrets.

## Notes

- The UI can use either the local backend or a custom external API endpoint.
- API keys entered in the browser are fine for local demo use, but production deployments should keep secrets on the server side.
- The current UI is designed as a demo/workspace experience and can be extended into a full multi-agent SaaS product.
