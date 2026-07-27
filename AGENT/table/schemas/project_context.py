"""
ProjectContext -- the single object that represents "everything we know
about this generated system so far."

Design note: rather than rewriting every agent to take/return a
ProjectContext directly (high-risk change to code that already works),
main.py assembles this object AFTER running the existing pipeline. This
gets you the architectural benefit -- one clean, typed, documented
object describing the whole project -- without touching the internals
of agents that are already tested and working. If you have time later
in the week, agents can be refactored to accept/return this directly;
it's a safe additive step either way.
"""

from typing import Optional
from pydantic import BaseModel, Field


class ProjectContext(BaseModel):
    """
    The full state of one generated multi-agent system, end to end.
    Every field maps to one stage of the pipeline.
    """

    user_input: str = Field(..., description="The original natural-language request")

    business_spec: dict = Field(
        default_factory=dict,
        description="Output of the Business Understanding stage: domain, goal, key_tasks, constraints, assumptions, confidence",
    )
    confidence_score: Optional[str] = Field(
        default=None, description="'high' / 'medium' / 'low' -- copied from business_spec for quick access"
    )

    architecture: dict = Field(
        default_factory=dict, description="Output of the Agent Planner stage: the chosen agents"
    )
    workflow: dict = Field(
        default_factory=dict, description="Output of the Workflow Designer stage: nodes + edges"
    )
    prompts: dict = Field(
        default_factory=dict, description="Output of the Prompt Generator stage: system prompt per agent"
    )
    tool_selection: dict = Field(
        default_factory=dict, description="Output of the Tool Selector stage: recommended stack + per-agent tools"
    )

    validation_report: dict = Field(
        default_factory=dict, description="Output of the Validation stage: issues found before code generation"
    )

    generated_code: dict = Field(
        default_factory=dict, description="Output of the Code Generator stage: {file_path: file_content}"
    )

    def summary(self) -> dict:
        """A compact view for logging/debugging -- avoids dumping huge code blobs."""
        return {
            "domain": self.business_spec.get("domain"),
            "confidence": self.confidence_score,
            "num_agents": len(self.architecture.get("agents", [])),
            "num_workflow_edges": len(self.workflow.get("edges", [])),
            "validation_passed": self.validation_report.get("is_valid"),
            "num_generated_files": len(self.generated_code),
        }