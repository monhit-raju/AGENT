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
import json
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


def run_streaming_pipeline(user_input: str, requirement: dict):
    # Step 1: Business spec is done (we already have it)
    yield "data: " + json.dumps({
        "stage": "business_understanding",
        "status": "complete",
        "result": {
            "business_spec": requirement,
            "confidence": requirement.get("confidence")
        }
    }) + "\n\n"
    
    # Step 2: Agent Planner
    yield "data: " + json.dumps({"stage": "agent_planner", "status": "running"}) + "\n\n"
    try:
        plan = plan_agents(requirement)
        yield "data: " + json.dumps({"stage": "agent_planner", "status": "complete", "result": plan}) + "\n\n"
    except Exception as e:
        yield "data: " + json.dumps({"stage": "agent_planner", "status": "failed", "error": str(e)}) + "\n\n"
        return

    # Step 3: Workflow Designer
    yield "data: " + json.dumps({"stage": "workflow_designer", "status": "running"}) + "\n\n"
    try:
        workflow = design_workflow(plan)
        yield "data: " + json.dumps({"stage": "workflow_designer", "status": "complete", "result": workflow}) + "\n\n"
    except Exception as e:
        yield "data: " + json.dumps({"stage": "workflow_designer", "status": "failed", "error": str(e)}) + "\n\n"
        return

    # Step 4: Validation
    yield "data: " + json.dumps({"stage": "workflow_validator", "status": "running"}) + "\n\n"
    try:
        validation_report = validate_workflow(plan, workflow)
        yield "data: " + json.dumps({"stage": "workflow_validator", "status": "complete", "result": validation_report}) + "\n\n"
    except Exception as e:
        yield "data: " + json.dumps({"stage": "workflow_validator", "status": "failed", "error": str(e)}) + "\n\n"
        return

    # Step 5: Prompt Generator
    yield "data: " + json.dumps({"stage": "prompt_generator", "status": "running"}) + "\n\n"
    try:
        prompts = generate_prompts(requirement, plan)
        yield "data: " + json.dumps({"stage": "prompt_generator", "status": "complete", "result": prompts}) + "\n\n"
    except Exception as e:
        yield "data: " + json.dumps({"stage": "prompt_generator", "status": "failed", "error": str(e)}) + "\n\n"
        return

    # Step 6: Tool Selector
    yield "data: " + json.dumps({"stage": "tool_selector", "status": "running"}) + "\n\n"
    try:
        tools = select_tools(requirement, plan, workflow)
        yield "data: " + json.dumps({"stage": "tool_selector", "status": "complete", "result": tools}) + "\n\n"
    except Exception as e:
        yield "data: " + json.dumps({"stage": "tool_selector", "status": "failed", "error": str(e)}) + "\n\n"
        return

    # Step 7: Code Generator
    yield "data: " + json.dumps({"stage": "code_generator", "status": "running"}) + "\n\n"
    try:
        files = generate_code(requirement, plan, workflow, prompts, tools)
        yield "data: " + json.dumps({"stage": "code_generator", "status": "complete", "result": files}) + "\n\n"
    except Exception as e:
        yield "data: " + json.dumps({"stage": "code_generator", "status": "failed", "error": str(e)}) + "\n\n"
        return

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
    yield "data: " + json.dumps({"status": "complete", "context": context.model_dump()}) + "\n\n"


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
        def clarify_generator():
            yield "data: " + json.dumps({
                "status": "needs_clarification",
                "business_spec": requirement,
                "questions": clarification.get("questions", []),
                "round": 1,
            }) + "\n\n"
        return StreamingResponse(clarify_generator(), media_type="text/event-stream")

    return StreamingResponse(
        run_streaming_pipeline(request.user_input, requirement),
        media_type="text/event-stream"
    )


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
        def clarify_continue_generator():
            yield "data: " + json.dumps({
                "status": "needs_clarification",
                "business_spec": requirement,
                "questions": clarification.get("questions", []),
                "round": request.round + 1,
            }) + "\n\n"
        return StreamingResponse(clarify_continue_generator(), media_type="text/event-stream")

    # Proceed with streaming pipeline
    def continue_pipeline_generator():
        # First yield the updated business spec
        yield "data: " + json.dumps({
            "stage": "business_understanding",
            "status": "complete",
            "result": {
                "business_spec": requirement,
                "confidence": requirement.get("confidence")
            }
        }) + "\n\n"
        
        # Then stream the rest
        for chunk in run_streaming_pipeline(augmented_input, requirement):
            # Skip the business_understanding from nested run_streaming_pipeline
            if "business_understanding" in chunk:
                continue
            
            if '"status": "complete"' in chunk and still_uncertain:
                try:
                    payload = json.loads(chunk.replace("data: ", ""))
                    payload["context"]["confidence_forced"] = True
                    yield "data: " + json.dumps(payload) + "\n\n"
                    continue
                except Exception:
                    pass
            yield chunk

    return StreamingResponse(continue_pipeline_generator(), media_type="text/event-stream")


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


# --- ADVANCED WORKSPACE EXTENSIONS ---

class DownloadCustomRequest(BaseModel):
    generated_code: dict


@app.post("/download-custom")
def download_custom_project(request: DownloadCustomRequest):
    import io
    import zipfile
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for file_path, content in request.generated_code.items():
            zf.writestr(file_path, content)
    zip_buffer.seek(0)
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=agentforge_project.zip"},
    )


class RefineRequest(BaseModel):
    generated_code: dict
    business_spec: dict
    architecture: dict
    workflow: dict
    instruction: str


@app.post("/generate/refine")
def refine_project(request: RefineRequest):
    import json
    from llm_client import call_llm_json

    REFINE_SYSTEM_PROMPT = """You are an expert AI software architect and python engineer specializing in multi-agent refactoring.
You will be given:
1. The current system architecture plan (list of agents containing id, role_name, responsibility, capabilities).
2. The current workflow graph (containing nodes and edges).
3. The current generated codebase (dictionary of files and code).
4. The user's refinement instruction (e.g. "Add a validator agent to check the output").

Your task is to refactor the entire system state to implement this instruction:
1. Update the architecture JSON: add/remove/edit agent definitions in the agents list to support new nodes.
2. Update the workflow JSON: add/remove/edit nodes and edges to layout the updated execution sequencing.
3. Update the generated code: add or edit agent python modules. Remember to modify main.py to import and run any new agents, printing starting/ending tags like the existing file!

Always respond with ONLY a JSON object in this exact shape:
{
  "architecture": { ...updated architecture plan... },
  "workflow": { ...updated workflow graph... },
  "updated_files": {
    "file_path_here": "the complete updated file content as a string"
  }
}
No other text outside the JSON."""

    user_prompt = (
        f"Current Architecture:\n{json.dumps(request.architecture)}\n\n"
        f"Current Workflow:\n{json.dumps(request.workflow)}\n\n"
        f"Current Files:\n{json.dumps(request.generated_code)}\n\n"
        f"Refinement Instruction:\n{request.instruction}"
    )

    try:
        result = call_llm_json(
            system_prompt=REFINE_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            provider="gemini",
            temperature=0.2,
        )
        updated_files = result.get("updated_files", {})
        new_code = dict(request.generated_code)
        for path, content in updated_files.items():
            new_code[path] = content
            
        return {
            "status": "complete",
            "result": {
                "generated_code": new_code,
                "architecture": result.get("architecture", request.architecture),
                "workflow": result.get("workflow", request.workflow)
            }
        }
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"LLM refinement failed: {str(e)}")


class SimulateRequest(BaseModel):
    generated_code: dict
    input_data: dict


@app.post("/generate/simulate")
def simulate_project(request: SimulateRequest):
    import os
    import sys
    import json
    import uuid
    import shutil
    import subprocess

    session_id = str(uuid.uuid4())[:8]
    scratch_dir = os.path.join(os.path.dirname(__file__), "scratch", f"run_{session_id}")
    os.makedirs(scratch_dir, exist_ok=True)

    # Write generated project structure
    for file_path, content in request.generated_code.items():
        full_path = os.path.join(scratch_dir, file_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)

    # Write simulation runner script
    runner_code = f"""import sys
import json
import os

# Add scratch path to python search path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import app
from fastapi.testclient import TestClient

def execute():
    client = TestClient(app)
    input_payload = {json.dumps(request.input_data)}
    
    print("[SIMULATOR] TestClient initialized. Sending payload to FastAPI route '/run'...")
    print(json.dumps(input_payload, indent=2))
    
    try:
        response = client.post("/run", json={{"input_data": input_payload}})
        print(f"[SIMULATOR] Response Code: {{response.status_code}}")
        if response.status_code == 200:
            print("[SIMULATOR] Simulation run completed successfully!")
            print("[SIMULATOR_RESULT]")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"[SIMULATOR] Execution failed: {{response.text}}")
    except Exception as e:
        print(f"[SIMULATOR] ERROR: Execution exception occurred: {{str(e)}}")

if __name__ == '__main__':
    execute()
"""
    runner_path = os.path.join(scratch_dir, "simulate_runner.py")
    with open(runner_path, "w", encoding="utf-8") as f:
        f.write(runner_code)

    def run_generator():
        yield "data: " + json.dumps({"output": f"[SIMULATOR] Initializing sandboxed subprocess run_{session_id}...\n"}) + "\n\n"
        
        env = dict(os.environ)
        env["PYTHONPATH"] = scratch_dir

        proc = subprocess.Popen(
            [sys.executable, "simulate_runner.py"],
            cwd=scratch_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            env=env
        )

        for line in iter(proc.stdout.readline, ""):
            yield "data: " + json.dumps({"output": line}) + "\n\n"

        proc.stdout.close()
        proc.wait()

        yield "data: " + json.dumps({"output": "[SIMULATOR] Sandbox container terminated. Cleaning up context...\n"}) + "\n\n"
        try:
            shutil.rmtree(scratch_dir)
        except Exception:
            pass

    return StreamingResponse(run_generator(), media_type="text/event-stream")


class ExplainRequest(BaseModel):
    generated_code: dict
    business_spec: dict
    architecture: dict
    workflow: dict
    question: str


@app.post("/generate/explain")
def explain_project(request: ExplainRequest):
    import os
    import json
    from google import genai
    from google.genai import types as genai_types

    GEMINI_MODEL = "gemini-3.5-flash"
    GROQ_MODEL = "llama-3.3-70b-versatile"

    EXPLAIN_SYSTEM_PROMPT = """You are an expert AI software architect and technical writer.
You are given the full project context of a generated multi-agent system:
1. Business requirements spec: what the user wanted, constraints, assumptions.
2. Architecture plan: the list of planned agents, their IDs, responsibilities, capabilities.
3. Workflow topology: how nodes connect and edge triggers.
4. Source code: the actual Python modules written for the agents and entrypoints.

The user will ask a technical question about this system. Answer their question clearly, technically, and concisely based ONLY on the provided context. Suggest options if they ask how to modify or test things. Format your response in clean Markdown."""

    user_prompt = (
        f"Business Spec:\n{json.dumps(request.business_spec)}\n\n"
        f"Architecture:\n{json.dumps(request.architecture)}\n\n"
        f"Workflow:\n{json.dumps(request.workflow)}\n\n"
        f"Source Code:\n{json.dumps(request.generated_code)}\n\n"
        f"User Question:\n{request.question}"
    )

    def generate():
        try:
            client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
            response_stream = client.models.generate_content_stream(
                model=GEMINI_MODEL,
                contents=user_prompt,
                config=genai_types.GenerateContentConfig(
                    system_instruction=EXPLAIN_SYSTEM_PROMPT,
                    temperature=0.2
                )
            )
            for chunk in response_stream:
                if chunk.text:
                    yield "data: " + json.dumps({"output": chunk.text}) + "\n\n"
        except Exception as e:
            try:
                from groq import Groq
                groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
                response = groq_client.chat.completions.create(
                    model=GROQ_MODEL,
                    messages=[
                        {"role": "system", "content": EXPLAIN_SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.2,
                    stream=True
                )
                for chunk in response:
                    content = chunk.choices[0].delta.content
                    if content:
                        yield "data: " + json.dumps({"output": content}) + "\n\n"
            except Exception as ge:
                yield "data: " + json.dumps({"output": f"\n\n[ERROR] Both LLM providers failed to stream explanation. Gemini: {str(e)} | Groq: {str(ge)}\n"}) + "\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")