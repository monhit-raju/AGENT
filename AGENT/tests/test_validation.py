import sys
import os

# Add table root to search path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from table.validators.workflow_validator import validate_workflow

def test_valid_workflow():
    agent_plan = {"agents": [{"id": "agent_a"}, {"id": "agent_b"}]}
    workflow = {
        "nodes": [{"id": "user"}, {"id": "agent_a"}, {"id": "agent_b"}],
        "edges": [
            {"from": "user", "to": "agent_a"},
            {"from": "agent_a", "to": "agent_b"},
            {"from": "agent_b", "to": "exit"},
        ]
    }
    report = validate_workflow(agent_plan, workflow)
    assert report["is_valid"] is True
    assert len(report["issues"]) == 0

def test_circular_dependency():
    agent_plan = {"agents": [{"id": "agent_a"}, {"id": "agent_b"}]}
    workflow = {
        "nodes": [{"id": "user"}, {"id": "agent_a"}, {"id": "agent_b"}],
        "edges": [
            {"from": "user", "to": "agent_a"},
            {"from": "agent_a", "to": "agent_b"},
            {"from": "agent_b", "to": "agent_a"},
        ]
    }
    report = validate_workflow(agent_plan, workflow)
    assert report["is_valid"] is False
    assert any("Circular dependency" in issue for issue in report["issues"])

def test_empty_workflow():
    agent_plan = {"agents": []}
    workflow = {"nodes": [], "edges": []}
    report = validate_workflow(agent_plan, workflow)
    assert report["is_valid"] is False
    assert any("empty" in issue for issue in report["issues"])

def test_dead_end_warning():
    agent_plan = {"agents": [{"id": "agent_a"}, {"id": "agent_b"}]}
    workflow = {
        "nodes": [{"id": "user"}, {"id": "agent_a"}, {"id": "agent_b"}],
        "edges": [
            {"from": "user", "to": "agent_a"},
            {"from": "agent_a", "to": "agent_b"},
        ]
    }
    report = validate_workflow(agent_plan, workflow)
    # agent_b receives inputs but has no outgoing transitions
    assert any("dead-end" in warn for warn in report["warnings"])

def test_unreachable_node_warning():
    agent_plan = {"agents": [{"id": "agent_a"}, {"id": "agent_b"}]}
    workflow = {
        "nodes": [{"id": "user"}, {"id": "agent_a"}, {"id": "agent_b"}],
        "edges": [
            {"from": "user", "to": "agent_a"},
            {"from": "agent_a", "to": "exit"},
        ]
    }
    report = validate_workflow(agent_plan, workflow)
    # agent_b is planned but has no edges connecting to user
    assert any("unreachable" in warn for warn in report["warnings"])

def test_self_loop_warning():
    agent_plan = {"agents": [{"id": "agent_a"}]}
    workflow = {
        "nodes": [{"id": "user"}, {"id": "agent_a"}],
        "edges": [
            {"from": "user", "to": "agent_a"},
            {"from": "agent_a", "to": "agent_a"},
            {"from": "agent_a", "to": "exit"},
        ]
    }
    report = validate_workflow(agent_plan, workflow)
    assert any("Self-loop detected" in warn for warn in report["warnings"])
