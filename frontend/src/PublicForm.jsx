import { useEffect, useRef, useState } from "react";
import { createSubmission } from "./api";

export default function PublicForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!photo) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  function onFile(e) {
    const f = e.target.files?.[0];
    if (f) acceptFile(f);
  }

  function acceptFile(f) {
    if (!f.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("Image is too large, max 10 MB");
      return;
    }
    setError("");
    setPhoto(f);
  }

  function onDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files?.[0];
    if (f) acceptFile(f);
  }

  function onDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function getLocalCount(key) {
    const raw = localStorage.getItem(key);
    const n = parseInt(raw ?? "0", 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }

  function bumpLocalCount(key) {
    const n = getLocalCount(key) + 1;
    localStorage.setItem(key, String(n));
  }

  async function submit(e) {
    e.preventDefault();
    if (!name || !email || !photo) {
      setError("Please fill all fields");
      return;
    }

    // client side soft limit for quick feedback
    const key = `submissions:${email.trim().toLowerCase()}`;
    const count = getLocalCount(key);
    if (count >= 2) {
      setError("You already submitted 2 requests with this email.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      await createSubmission({ name, email, photo });
      bumpLocalCount(key);
      setDone(true);
      setName("");
      setEmail("");
      setPhoto(null);
    } catch (err) {
      // Server also enforces the limit and will send a clear 400 message
      setError(err.message || "Failed to submit");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="center-wrap">
        <div className="card success-card">
          <div className="success-icon">✓</div>
          <h2>Thanks, we got your request</h2>
          <p className="muted">We will email you when your final photo is ready.</p>
          <button className="btn" onClick={() => setDone(false)}>Send another</button>
        </div>
      </div>
    );
  }

  return (
    <div className="center-wrap">
      <form className="card form-card" onSubmit={submit}>
        <h2>Send your photo</h2>
        <p className="muted">Fill your name and email, attach one image.</p>

        <label className="label">Name</label>
        <input
          className="input"
          placeholder="Jane Doe"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />

        <label className="label">Email</label>
        <input
          className="input"
          placeholder="jane@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          type="email"
          required
        />

        <label className="label">Photo</label>
        <div
          className={`dropzone ${preview ? "dz-hasfile" : ""}`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          {preview ? (
            <div className="dz-preview">
              <img src={preview} alt="preview" />
              <button
                className="btn secondary"
                type="button"
                onClick={(e) => { e.stopPropagation(); setPhoto(null); setPreview(""); }}
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="dz-empty">
              <div className="dz-icon">⬆️</div>
              <div className="dz-text">Drag and drop an image here, or click to browse</div>
              <div className="dz-hint muted">Max 10 MB. JPG, PNG, WebP.</div>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={onFile} hidden />
        </div>

        {error && <p className="error">{error}</p>}

        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? <span className="spinner" /> : "Send"}
        </button>
      </form>
    </div>
  );
}
