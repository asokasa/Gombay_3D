export const apiBase = import.meta.env.VITE_API_BASE || "/api";

export async function api(path, { method = "GET", body, token } = {}) {
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${apiBase}${path}`, {
    method,
    headers,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  const text = await res.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (!res.ok) {
    throw new Error(data?.error || res.statusText);
  }

  return data;
}
