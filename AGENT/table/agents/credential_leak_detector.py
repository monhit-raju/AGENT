import json
import re

def detect_credential_leaks(files: dict) -> dict:
    leaks = []
    # Regular expressions for generic secrets
    patterns = {
        "API Key": r"(?:api[_-]?key|secret|token|password|passwd|auth)\s*=\s*['\"][a-zA-Z0-9_\-\.\:\/]{16,}['\"]",
        "Connection String": r"postgresql\+psycopg2:\/\/[^:]+:[^@]+@[^/]+\/[^']+",
    }
    
    for path, content in files.items():
        if path.endswith(".py") or path.endswith(".json") or path.endswith(".env"):
            lines = content.splitlines()
            for line_idx, line in enumerate(lines):
                # Ignore comment lines and lines containing standard env loads
                if line.strip().startswith("#") or "os.environ" in line:
                    continue
                for sec_type, pattern in patterns.items():
                    if re.search(pattern, line, re.IGNORECASE):
                        # Mask the secret match
                        leaks.append({
                            "file": path,
                            "line": line_idx + 1,
                            "secret_type": sec_type,
                            "severity": "high"
                        })
                        
    # Save a report
    if leaks:
        files["docs/SECRET_LEAK_REPORT.json"] = json.dumps({"status": "leaked", "leaks": leaks}, indent=2)
        return {"status": "leaked", "leaks": leaks}
        
    return {"status": "clean", "checked_files": len(files)}
