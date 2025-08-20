// Base API URL. Set VITE_API_URL in .env if you need to change it.
export const API = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:5005";

export async function createSubmission({ name, email, photo }) {
  const fd = new FormData();
  fd.append("name", name);
  fd.append("email", email);
  fd.append("photo", photo);
  const res = await fetch(`${API}/api/public/submissions`, { method: "POST", body: fd });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Failed to submit");
  }
  return res.json();
}

export async function adminLogin(username, password) {
  const res = await fetch(`${API}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Login failed");
  }
  return res.json(); // { token }
}

export async function listSubmissions(token, page = 1, pageSize = 20) {
  const res = await fetch(`${API}/api/admin/submissions?page=${page}&pageSize=${pageSize}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Failed to load");
  }
  return res.json(); // { total, items }
}

export async function sendEmail(token, id, { subject, body, attachment }) {
  const fd = new FormData();
  fd.append("subject", subject);
  fd.append("body", body);
  if (attachment) fd.append("attachment", attachment);
  const res = await fetch(`${API}/api/admin/submissions/${id}/email`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd
  });
  if (!res.ok) {
    let detail = "";
    try { detail = await res.text(); } catch(e) { console.error(e); }
    throw new Error(detail || "Email send failed");
  }
  return res.text();
}

// Prefix API origin for relative URLs like "/uploads/xyz.png"
export function fileUrl(u) {
  if (!u) return "";
  return u.startsWith("/") ? `${API}${u}` : u;
}
