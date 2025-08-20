import { useState } from "react";
import { adminLogin } from "./api";

export default function AdminLogin({ onLoggedIn }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const { token } = await adminLogin(u, p);
      onLoggedIn(token);
    } catch (e) {
      setErr(e.message || "Invalid login");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center-wrap">
      <form className="card form-card" onSubmit={submit}>
        <h2>Admin sign in</h2>
        <label className="label">Username</label>
        <input className="input" autoFocus value={u} onChange={e => setU(e.target.value)} />
        <label className="label">Password</label>
        <input className="input" type="password" value={p} onChange={e => setP(e.target.value)} />
        {err && <p className="error">{err}</p>}
        <button className="btn primary" disabled={busy}>
          {busy ? <span className="spinner" /> : "Login"}
        </button>
      </form>
    </div>
  );
}
