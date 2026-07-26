"""
Validation Agent -- runs AFTER Workflow Designer, BEFORE Prompt
Generator / Tool Selector / Code Generator.

Deliberately NOT an LLM call. Structural validation (does every edge
reference a real agent, are there orphan agents, etc.) is something
plain Python can check with 100% reliability -- there's no reason to
spend an API call or risk hallucination on a task that's really just
graph/set logic. This is the same "deterministic where it must be
reliable" principle used in the Code Generator's static file templates.

Produces a validation_report that goes straight into ProjectContext,
matching the doc's requested output.
"""


def validate_workflow(agent_plan: dict, workflow: dict) -> dict:
    """
    Checks the agent plan + workflow for structural problems:
    - missing agents (workflow references an id not in the agent plan)
    - orphan agents (agent exists in the plan but never appears in any edge)
    - missing "user" starting node
    - circular dependencies (a cycle in the edges, excluding self-loops)

    Returns a validation_report dict: {"is_valid": bool, "issues": [...], "warnings": [...]}.
    Issues are hard problems; warnings are things worth a human glance
    but that won't break the generated project.
    """
    issues = []
    warnings = []

    planned_ids = {a.get("id") for a in agent_plan.get("agents", []) if a.get("id")}
    node_ids = {n.get("id") for n in workflow.get("nodes", []) if n.get("id")}
    edges = workflow.get("edges", [])

    # 1. Every edge must reference ids that actually exist somewhere.
    all_known_ids = planned_ids | node_ids | {"user"}
    for edge in edges:
        for key in ("from", "to"):
            ref = edge.get(key)
            if ref and ref not in all_known_ids:
                issues.append(f"Edge references unknown agent id '{ref}' (from={edge.get('from')}, to={edge.get('to')})")

    # 2. Every planned agent should appear in at least one edge.
    referenced_ids = {edge.get("from") for edge in edges} | {edge.get("to") for edge in edges}
    for agent_id in planned_ids:
        if agent_id not in referenced_ids:
            warnings.append(f"Agent '{agent_id}' was planned but never appears in the workflow -- it may be unreachable")

    # 3. There should be a "user" starting point somewhere in the edges.
    if "user" not in referenced_ids:
        warnings.append("No 'user' node found as a starting point in the workflow edges")

    # 4. Basic circular dependency check (simple cycle detection via DFS).
    graph = {}
    for edge in edges:
        graph.setdefault(edge.get("from"), []).append(edge.get("to"))

    def _has_cycle(node, visited, stack):
        visited.add(node)
        stack.add(node)
        for neighbor in graph.get(node, []):
            if neighbor not in visited:
                if _has_cycle(neighbor, visited, stack):
                    return True
            elif neighbor in stack:
                return True
        stack.discard(node)
        return False

    visited = set()
    for node in list(graph.keys()):
        if node not in visited:
            if _has_cycle(node, visited, set()):
                issues.append("Circular dependency detected in the workflow graph")
                break

    is_valid = len(issues) == 0

    return {
        "is_valid": is_valid,
        "issues": issues,
        "warnings": warnings,
    }


if __name__ == "__main__":
    # Manual test -- run from the AGENT root folder:
    #   python -m validators.workflow_validator

    # A deliberately broken example: edge references an id that doesn't exist.
    fake_plan = {"agents": [{"id": "intake_agent"}, {"id": "ranking_agent"}]}
    fake_workflow = {
        "nodes": [{"id": "user"}, {"id": "intake_agent"}, {"id": "ranking_agent"}],
        "edges": [
            {"from": "user", "to": "intake_agent"},
            {"from": "intake_agent", "to": "typo_agent"},  # bug: doesn't exist
        ],
    }
    report = validate_workflow(fake_plan, fake_workflow)
    print("Validation report (should show 1 issue):")
    import json
    print(json.dumps(report, indent=2))