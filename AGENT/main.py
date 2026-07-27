"""
This is the API server. Run it with:  python -m uvicorn main:app --reload
Then open http://127.0.0.1:8000/docs to test it in the browser.

Two-endpoint flow for handling vague input (v2 -- now verifies that
clarification actually helped, instead of blindly trusting one round):

  POST /generate
    -> runs Business Understanding only.
    -> if confidence is "low" OR "medium", STOPS and returns clarifying
       questions instead of continuing on a shaky foundation.
    -> if confidence is "high", runs the FULL pipeline and returns the
       complete ProjectContext.

  POST /generate/continue
    -> merges the user's answers into the input, RE-RUNS Business
       Understanding on the richer input, and checks: did confidence
       actually improve?
       - If still not "high" and we haven't hit the round limit, asks
         ANOTHER round of clarifying questions (based on the updated
         spec) instead of pretending the first round was enough.
       - If confidence is "high", OR the round limit is hit, proceeds
         with the full pipeline -- the round limit exists so a demo
         can never get stuck in an endless question loop.

Both responses include a "status" field ("needs_clarification" or
"complete") so the frontend always knows which UI to show, and
"needs_clarification" responses include a "round" number.
"""

import io
import os
import sys
import zipfile
from typing import List

# Ensure the `table` directory is on sys.path so imports like
# `from agents...`, `from validators...`, and `from schemas...` work.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "table"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from agents.requirement_analysis import analyze_requirement
from agents.agent_planner import plan_agents
from agents.workflow_designer import design_workflow
from agents.prompt_generator import generate_prompts
from agents.tool_selector import select_tools
from agents.code_generator import generate_code
from agents.clarification_agent import generate_clarifying_questions

from validators.workflow_validator import validate_workflow
from schemas.project_context import ProjectContext

app = FastAPI(title="AgentForge API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# "low" AND "medium" now both trigger clarification -- "medium" used to
# sail through to the full pipeline, which let a lot of genuinely vague
# requests skip the question step entirely.
CLARIFICATION_TRIGGER_CONFIDENCE = {"low", "medium"}

# Hard cap on clarification rounds. Without this, a request that
# genuinely can't be clarified (or an LLM that keeps rating its own
# answer as uncertain) could loop forever. After this many rounds, the
# pipeline proceeds regardless of confidence -- imperfect information
# beats a demo that never finishes.
MAX_CLARIFICATION_ROUNDS = 2


class GenerateRequest(BaseModel):
    user_input: str


class ClarificationAnswer(BaseModel):
    question: str
    answer: str


class ContinueRequest(BaseModel):
    user_input: str
    answers: List[ClarificationAnswer]  # ALL answers so far, across every round
    round: int = 1


def _merge_answers_into_input(user_input: str, answers: List[ClarificationAnswer]) -> str:
    qa_lines = "\n".join(f"- {a.question}: {a.answer}" for a in answers)
    return f"{user_input}\n\nAdditional details provided by the user:\n{qa_lines}"


def _run_pipeline_from_requirement(user_input: str, requirement: dict) -> ProjectContext:
    """
    Runs Stage 2 onward using an ALREADY-COMPUTED Stage 1 result, so
    /generate/continue doesn't waste an extra LLM call re-analyzing the
    requirement a second time after it just checked confidence.
    """
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


def _run_full_pipeline(user_input: str) -> ProjectContext:
    """Convenience wrapper: runs Stage 1 fresh, then the rest of the pipeline."""
    requirement = analyze_requirement(user_input)
    return _run_pipeline_from_requirement(user_input, requirement)


@app.get("/")
def health_check():
    return {"status": "AgentForge API is running"}


@app.post("/generate")
def generate_system(request: GenerateRequest):
    """
    Runs Stage 1 first. If confidence is low or medium, stops and asks
    clarifying questions instead of continuing on a shaky spec.
    """
    requirement = analyze_requirement(request.user_input)
    confidence = requirement.get("confidence")

    if confidence in CLARIFICATION_TRIGGER_CONFIDENCE:
        clarification = generate_clarifying_questions(requirement)
        return {
            "status": "needs_clarification",
            "business_spec": requirement,
            "questions": clarification.get("questions", []),
            "round": 1,
        }

    context = _run_pipeline_from_requirement(request.user_input, requirement)
    return {"status": "complete", **context.model_dump()}


@app.post("/generate/continue")
def generate_continue(request: ContinueRequest):
    """
    Merges all answers so far into the input and RE-CHECKS confidence
    before proceeding -- this is the actual verification step. If the
    answers didn't genuinely resolve the ambiguity, and we haven't hit
    the round limit, this asks another round instead of pretending the
    first round was good enough.
    """
    augmented_input = _merge_answers_into_input(request.user_input, request.answers)
    requirement = analyze_requirement(augmented_input)
    confidence = requirement.get("confidence")

    still_uncertain = confidence in CLARIFICATION_TRIGGER_CONFIDENCE
    rounds_remaining = request.round < MAX_CLARIFICATION_ROUNDS

    if still_uncertain and rounds_remaining:
        clarification = generate_clarifying_questions(requirement)
        return {
            "status": "needs_clarification",
            "business_spec": requirement,
            "questions": clarification.get("questions", []),
            "round": request.round + 1,
        }

    context = _run_pipeline_from_requirement(augmented_input, requirement)
    response = {"status": "complete", **context.model_dump()}
    if still_uncertain:
        # Hit the round limit while still not fully confident -- proceed,
        # but flag it honestly instead of silently pretending it's fine.
        response["confidence_forced"] = True
    return response


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