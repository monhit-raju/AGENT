"""
This is the API server. Run it with:  python -m uvicorn main:app --reload
Then open http://127.0.0.1:8000/docs to test it in the browser.

Two-endpoint flow for handling vague input:

  POST /generate
    -> runs Business Understanding only.
    -> if confidence is "low", STOPS and returns clarifying questions
       instead of running the rest of the pipeline (saves API calls on
       a request that would likely need rework anyway).
    -> if confidence is fine, runs the FULL pipeline and returns the
       complete ProjectContext, same as before.

  POST /generate/continue
    -> takes the original input + the user's answers to the clarifying
       questions, merges them into a richer input, and runs the FULL
       pipeline on that -- reusing every existing, tested stage as-is.

Both responses include a "status" field: "needs_clarification" or
"complete", so the frontend always knows which UI to show.
"""

import io
import zipfile
from typing import List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from table.agents.requirement_analysis import analyze_requirement
from table.agents.agent_planner import plan_agents
from table.agents.workflow_designer import design_workflow
from table.agents.prompt_generator import generate_prompts
from table.agents.tool_selector import select_tools
from table.agents.code_generator import generate_code
from table.agents.clarification_agent import generate_clarifying_questions

from table.validators.workflow_validator import validate_workflow
from table.schemas.project_context import ProjectContext

app = FastAPI(title="AgentForge API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Only "low" confidence triggers a clarification round-trip. Change this
# to {"low", "medium"} if you want clarification to trigger more often --
# tune based on how your test inputs actually behave.
CLARIFICATION_TRIGGER_CONFIDENCE = {"low"}


class GenerateRequest(BaseModel):
    user_input: str


class ClarificationAnswer(BaseModel):
    question: str
    answer: str


class ContinueRequest(BaseModel):
    user_input: str
    answers: List[ClarificationAnswer]


def _run_full_pipeline(user_input: str) -> ProjectContext:
    """
    Runs Stage 1 through Stage 6, validating structure before code
    generation, and returns one assembled ProjectContext. Does NOT
    check confidence -- caller decides whether clarification is needed
    before calling this.
    """
    requirement = analyze_requirement(user_input)
    plan = plan_agents(requirement)
    workflow = design_workflow(plan)

    validation_report = validate_workflow(plan, workflow)
    if not validation_report["is_valid"]:
        print(f"[validation] WARNING: workflow validation failed: {validation_report['issues']}")

    prompts = generate_prompts(requirement, plan)
    tools = select_tools(requirement, plan, workflow)
    files = generate_code(requirement, plan, workflow, prompts, tools)

    context = ProjectContext(
        user_input=user_input,
        business_spec=requirement,
        confidence_score=requirement.get("confidence"),
        architecture=plan,
        workflow=workflow,
        prompts=prompts,
        tool_selection=tools,
        validation_report=validation_report,
        generated_code=files,
    )

    print(f"[pipeline] done: {context.summary()}")
    return context


@app.get("/")
def health_check():
    return {"status": "AgentForge API is running"}


@app.post("/generate")
def generate_system(request: GenerateRequest):
    """
    Runs Stage 1 first. If confidence is low, stops and asks clarifying
    questions instead of continuing. Otherwise runs the full pipeline.
    """
    requirement = analyze_requirement(request.user_input)
    confidence = requirement.get("confidence")

    if confidence in CLARIFICATION_TRIGGER_CONFIDENCE:
        clarification = generate_clarifying_questions(requirement)
        return {
            "status": "needs_clarification",
            "business_spec": requirement,
            "questions": clarification.get("questions", []),
        }

    context = _run_full_pipeline(request.user_input)
    return {"status": "complete", **context.model_dump()}


@app.post("/generate/continue")
def generate_continue(request: ContinueRequest):
    """
    Call this after the user has answered the clarifying questions from
    /generate. Merges the answers into the original input and runs the
    full pipeline on the richer, now-specific request.
    """
    qa_lines = "\n".join(f"- {a.question}: {a.answer}" for a in request.answers)
    augmented_input = f"{request.user_input}\n\nAdditional details provided by the user:\n{qa_lines}"

    context = _run_full_pipeline(augmented_input)
    return {"status": "complete", **context.model_dump()}


@app.get("/download-project")
def download_project(user_input: str):
    """
    Runs the full pipeline directly (skips clarification -- intended
    for quick testing or for inputs you already know are specific) and
    returns a downloadable .zip. Example:
      /download-project?user_input=Build me an AI customer support system
    """
    context = _run_full_pipeline(user_input)
    files = context.generated_code

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for file_path, content in files.items():
            zf.writestr(file_path, content)
    zip_buffer.seek(0)

    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=generated_project.zip"},
    )