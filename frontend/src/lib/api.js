const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.json();
}

export const api = {
  health: () => request("/health"),
  certifications: () => request("/certifications"),
  learners: () => request("/learners"),
  learner: (id) => request(`/learners/${id}`),
  chat: (message, employeeId, answers) =>
    request("/chat", {
      method: "POST",
      body: JSON.stringify({ message, employee_id: employeeId, answers }),
    }),
  employeeFlow: (payload) =>
    request("/employee-flow", { method: "POST", body: JSON.stringify(payload) }),
  managerChat: (message) =>
    request("/manager-chat", { method: "POST", body: JSON.stringify({ message }) }),
  fullDemo: () => request("/demo/full", { method: "POST" }),
};
