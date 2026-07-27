// API helpers. The base URL and API key are read from localStorage so users
// can point the UI at an external Agent API without rebuilding.
function getSettings() {
  const envBase = import.meta.env.VITE_API_BASE;
  const storedBase = localStorage.getItem("agent_api_base");
  const storedKey = localStorage.getItem("agent_api_key");
  return {
    base: storedBase || envBase || "http://127.0.0.1:8000",
    key: storedKey || "",
  };
}

function makeHeaders(hasJson = true) {
  const { key } = getSettings();
  const headers = {};
  if (hasJson) headers["Content-Type"] = "application/json";
  if (key) headers["Authorization"] = `Bearer ${key}`;
  return headers;
}

async function handleResponse(res) {
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (e) {
    json = { text };
  }
  if (!res.ok) {
    const err = new Error(`Request failed: ${res.status}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

export async function generateSystem(userInput) {
  const { base } = getSettings();
  const res = await fetch(`${base.replace(/\/$/, '')}/generate`, {
    method: "POST",
    headers: makeHeaders(true),
    body: JSON.stringify({ user_input: userInput }),
  });
  return handleResponse(res);
}

export async function continueGeneration(userInput, answers, round = 1) {
  const { base } = getSettings();
  const res = await fetch(`${base.replace(/\/$/, '')}/generate/continue`, {
    method: "POST",
    headers: makeHeaders(true),
    body: JSON.stringify({ user_input: userInput, answers, round }),
  });
  return handleResponse(res);
}

export function downloadProjectUrl(userInput) {
  const { base } = getSettings();
  return `${base.replace(/\/$/, '')}/download-project?user_input=${encodeURIComponent(userInput)}`;
}