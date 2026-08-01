// API helpers. The base URL and API key are read from localStorage so users
// can point the UI at an external Agent API without rebuilding.
export function getSettings() {
  const envBase = import.meta.env.VITE_API_BASE;
  const storedBase = localStorage.getItem("agent_api_base");
  const storedKey = localStorage.getItem("agent_api_key");

  let defaultBase = "http://127.0.0.1:8000";
  if (typeof window !== "undefined") {
    // If running in development (e.g. localhost:5173), we default to backend port 8000 on the same host.
    // Otherwise, assume the frontend is hosted on the same origin (e.g. production deploy where FastAPI serves frontend).
    const { protocol, hostname, port } = window.location;
    if (hostname) {
      if (port === "5173") {
        defaultBase = `${protocol}//${hostname}:8000`;
      } else {
        defaultBase = `${protocol}//${hostname}${port ? ":" + port : ""}`;
      }
    }
  }

  return {
    base: storedBase || envBase || defaultBase,
    key: storedKey || "",
    geminiKey: localStorage.getItem("gemini_api_key") || "",
    groqKey: localStorage.getItem("groq_api_key") || "",
    openrouterKey: localStorage.getItem("openrouter_api_key") || "",
    openaiKey: localStorage.getItem("openai_api_key") || "",
  };
}

function makeHeaders(hasJson = true) {
  const { key, geminiKey, groqKey, openrouterKey, openaiKey } = getSettings();
  const headers = {};
  if (hasJson) headers["Content-Type"] = "application/json";
  if (key) headers["Authorization"] = `Bearer ${key}`;
  if (geminiKey) headers["X-Gemini-Key"] = geminiKey;
  if (groqKey) headers["X-Groq-Key"] = groqKey;
  if (openrouterKey) headers["X-OpenRouter-Key"] = openrouterKey;
  if (openaiKey) headers["X-OpenAI-Key"] = openaiKey;
  return headers;
}

async function handleStreamResponse(res, onChunk) {
  if (!res.ok) {
    const text = await res.text();
    let json;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (e) {
      json = { text };
    }
    const err = new Error(`Request failed: ${res.status}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    // The last element might be incomplete; keep it in the buffer
    buffer = lines.pop() || "";

    for (const line of lines) {
      const cleanLine = line.trim();
      if (!cleanLine) continue;

      if (cleanLine.startsWith("data: ")) {
        const rawJson = cleanLine.slice(6);
        try {
          const parsed = JSON.parse(rawJson);
          onChunk(parsed);
        } catch (e) {
          console.error("Failed to parse stream chunk:", e, rawJson);
        }
      }
    }
  }
}

export async function generateSystem(userInput, onChunk) {
  const { base } = getSettings();
  const res = await fetch(`${base.replace(/\/$/, '')}/generate`, {
    method: "POST",
    headers: makeHeaders(true),
    body: JSON.stringify({ user_input: userInput }),
  });
  return handleStreamResponse(res, onChunk);
}

export async function continueGeneration(userInput, answers, onChunk, round = 1) {
  const { base } = getSettings();
  const res = await fetch(`${base.replace(/\/$/, '')}/generate/continue`, {
    method: "POST",
    headers: makeHeaders(true),
    body: JSON.stringify({ user_input: userInput, answers, round }),
  });
  return handleStreamResponse(res, onChunk);
}

export function downloadProjectUrl(userInput) {
  const { base } = getSettings();
  return `${base.replace(/\/$/, '')}/download-project?user_input=${encodeURIComponent(userInput)}`;
}

export async function checkBackendHealth() {
  const { base } = getSettings();
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/health`);
    if (res.ok) {
      const data = await res.json();
      return data.status ? "healthy" : "warning";
    }
  } catch (e) {
    // console.error(e);
  }
  return "offline";
}

export async function runSimulation(generatedCode, inputData, onChunk) {
  const { base } = getSettings();
  const res = await fetch(`${base.replace(/\/$/, '')}/generate/simulate`, {
    method: "POST",
    headers: makeHeaders(true),
    body: JSON.stringify({ generated_code: generatedCode, input_data: inputData }),
  });
  return handleStreamResponse(res, onChunk);
}

export async function refineSystem(generatedCode, businessSpec, architecture, workflow, instruction) {
  const { base } = getSettings();
  const res = await fetch(`${base.replace(/\/$/, '')}/generate/refine`, {
    method: "POST",
    headers: makeHeaders(true),
    body: JSON.stringify({
      generated_code: generatedCode,
      business_spec: businessSpec,
      architecture: architecture,
      workflow: workflow,
      instruction: instruction
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Refinement request failed (${res.status}): ${text}`);
  }
  return await res.json();
}

export async function downloadCustomProject(generatedCode) {
  const { base } = getSettings();
  const res = await fetch(`${base.replace(/\/$/, '')}/download-custom`, {
    method: "POST",
    headers: makeHeaders(true),
    body: JSON.stringify({ generated_code: generatedCode }),
  });
  if (!res.ok) throw new Error("Failed to download custom project ZIP.");
  
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "agentforge_project.zip";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function explainSystem(generatedCode, businessSpec, architecture, workflow, question, onChunk) {
  const { base } = getSettings();
  const res = await fetch(`${base.replace(/\/$/, '')}/generate/explain`, {
    method: "POST",
    headers: makeHeaders(true),
    body: JSON.stringify({
      generated_code: generatedCode,
      business_spec: businessSpec,
      architecture: architecture,
      workflow: workflow,
      question: question
    }),
  });
  return handleStreamResponse(res, onChunk);
}