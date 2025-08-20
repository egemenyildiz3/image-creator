import { useEffect, useMemo, useState } from "react";
import { listSubmissions, sendEmail, fileUrl } from "./api";

function fmtDate(iso) {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString();
  } catch {
    return "";
  }
}

function Chip({ text, color = "gray" }) {
  return <span className={`chip ${color === "green" ? "chip-green" : "chip"}`}>{text}</span>;
}

function useToast() {
  const [toast, setToast] = useState(null);
  function show(message, type = "info") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2200);
  }
  return { toast, show };
}

export default function AdminDashboard({ token, onLogout }) {
  const pageSize = 12;
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState(null);

  const [subject, setSubject] = useState("Your final photo");
  const [body, setBody] = useState("Hi {Name}, your final photo is attached.");
  const [attach, setAttach] = useState(null);
  const [sending, setSending] = useState(false);

  const { toast, show } = useToast();

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  async function refresh() {
    setLoading(true);
    try {
      const res = await listSubmissions(token, page, pageSize);
      setTotal(res.total);
      setItems(res.items);

      // If selection is not in the new page, clear it so the right panel resets
      if (selected && !res.items.some(i => i.id === selected.id)) {
        setSelected(null);
        setSubject("Your final photo");
        setBody("Hi {Name}, your final photo is attached.");
        setAttach(null);
      } else if (selected) {
        // update selection with the latest row data
        const updated = res.items.find(i => i.id === selected.id);
        if (updated) setSelected(updated);
      }
    } catch (e) {
      show(e.message || "Failed to load", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function pick(s) {
    setSelected(s);
    setSubject("Your final photo");
    setBody(`Hi ${s.name}, your final photo is attached.`);
    setAttach(null);
  }

  async function doSend() {
    if (!selected) return;
    setSending(true);
    try {
      await sendEmail(token, selected.id, { subject, body, attachment: attach });
      show("Email sent", "success");
      setSelected({ ...selected, status: "emailed" });
      await refresh();
    } catch (e) {
      show(e.message || "Failed to send", "error");
    } finally {
      setSending(false);
    }
  }

  function copy(text) {
    navigator.clipboard.writeText(text)
      .then(() => show("Copied"), () => show("Copy failed", "error"));
  }

  // lightbox for larger preview
  const [lightbox, setLightbox] = useState("");

  return (
    <div className="admin-grid" /* two columns, defined in styles.css */>
      {/* LEFT: submissions list */}
      <section className="card" style={{ overflow: "hidden" }}>
        <div className="row-between" style={{ marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>Submissions</h3>
          <div className="row-gap">
            <button className="btn secondary" onClick={() => refresh()}>Refresh</button>
            <button
              className="btn danger"
              onClick={() => {
                // fully reset UI state on logout
                setSelected(null);
                setAttach(null);
                setSubject("Your final photo");
                setBody("Hi {Name}, your final photo is attached.");
                onLogout();
              }}
            >
              Logout
            </button>
          </div>
        </div>

        <div className="toolbar" style={{ marginBottom: 8 }}>
          <div className="muted">Total {total}</div>
          <div className="row-gap">
            <button className="btn secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
            <span className="muted">Page {page} of {totalPages}</span>
            <button className="btn secondary" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>

        {loading ? (
          <div className="center small-pad"><span className="spinner" /></div>
        ) : items.length === 0 ? (
          <div className="empty">No submissions yet</div>
        ) : (
          <ul className="grid-cards" /* responsive grid */>
            {items.map(s => (
              <li
                key={s.id}
                className={`card item ${selected?.id === s.id ? "item-selected" : ""}`}
                onClick={() => pick(s)}
                style={{ margin: 0 }}
              >
                <div className="row-between" style={{ gap: 12 }}>
                  <div className="col" style={{ minWidth: 0 }}>
                    <div className="item-title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.name || "(no name)"}
                    </div>
                    <div className="item-sub">
                      <span className="mono" style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                        {s.email}
                      </span>
                      <button
                        className="btn tiny"
                        onClick={(e) => { e.stopPropagation(); copy(s.email); }}
                        title="Copy email"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="item-meta">
                      <Chip text={s.status || "new"} color={s.status === "emailed" ? "green" : "gray"} />
                      <span className="muted">{fmtDate(s.createdAt)}</span>
                    </div>
                  </div>

                  {s.originalImageUrl && (
                    <img
                      src={fileUrl(s.originalImageUrl)}
                      alt=""
                      className="thumb"
                      style={{
                        width: 140,
                        height: 104,
                        objectFit: "cover",
                        borderRadius: 10,
                        border: "1px solid var(--border)",
                        flex: "0 0 auto"
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightbox(fileUrl(s.originalImageUrl));
                      }}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* RIGHT: email composer */}
      <section className="card composer" style={{ minHeight: 420, display: "flex", flexDirection: "column" }}>
        <h3 style={{ marginTop: 0 }}>Email composer</h3>

        {!selected ? (
          // strict empty state container to avoid stray elements
          <div
            className="empty"
            style={{
              marginTop: 8,
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            Select a submission on the left
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            <div className="row-between">
              <div>To: <b>{selected.email}</b></div>
              <div className="muted">For: {selected.name || "(no name)"}</div>
            </div>

            <label className="label">Subject</label>
            <input
              className="input"
              value={subject}
              onChange={e => setSubject(e.target.value)}
            />

            <label className="label">Body</label>
            <textarea
              className="textarea"
              rows={8}
              value={body}
              onChange={e => setBody(e.target.value)}
            />

            <div className="hint row-gap" style={{ gap: 6 }}>
              Quick insert:
              <button className="btn tiny" type="button" onClick={() => setBody(b => b + " {Name}")}>{"{Name}"}</button>
              <button className="btn tiny" type="button" onClick={() => setBody(b => b + " {Email}")}>{"{Email}"}</button>
            </div>

            <label className="label">Attachment</label>
            <input
              className="input"
              type="file"
              accept="image/*"
              onChange={e => setAttach(e.target.files?.[0] ?? null)}
            />

            <div className="actions row-gap" style={{ marginTop: 6 }}>
              <button className="btn primary" disabled={sending} onClick={doSend}>
                {sending ? <span className="spinner" /> : "Send email"}
              </button>
              <button
                className="btn secondary"
                onClick={() => {
                  setSelected(null);
                  setAttach(null);
                  setSubject("Your final photo");
                  setBody("Hi {Name}, your final photo is attached.");
                }}
              >
                Clear
              </button>
            </div>

            <div className="muted small-pad">Original image</div>
            {selected.originalImageUrl ? (
              <div style={{ border: "1px dashed var(--border)", borderRadius: 12, padding: 8 }}>
                <img
                  className="preview"
                  src={fileUrl(selected.originalImageUrl)}
                  alt="original"
                  onClick={() => setLightbox(fileUrl(selected.originalImageUrl))}
                  style={{
                    width: "100%",
                    maxHeight: 360,
                    objectFit: "contain",
                    display: "block",
                    borderRadius: 10
                  }}
                />
              </div>
            ) : (
              <div className="empty small-pad">No image</div>
            )}
          </div>
        )}
      </section>

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type === "success" ? "toast-success" : toast.type === "error" ? "toast-error" : ""}`}>
          {toast.message}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox("")}>
          <img src={lightbox} alt="full" />
        </div>
      )}
    </div>
  );
}
