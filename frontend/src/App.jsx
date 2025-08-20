import { useState } from "react";
import PublicForm from "./PublicForm";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import "./styles.css";

export default function App() {
  const [token, setToken] = useState(null);

  const isAdminRoute = window.location.pathname.toLowerCase().startsWith("/admin");

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="container row-between">
          <div className="brand">
            <span className="brand-mark">📸</span>
            <span className="brand-text">Image Requests</span>
          </div>
          <nav className="nav">
            {isAdminRoute ? (
              token ? <span className="badge">Admin</span> : <span className="muted">Admin login</span>
            ) : (
              <a className="link" href="/admin">Admin</a>
            )}
          </nav>
        </div>
      </header>

      <main className="container">
        {isAdminRoute
          ? token
            ? <AdminDashboard token={token} onLogout={() => setToken(null)} />
            : <AdminLogin onLoggedIn={setToken} />
          : <PublicForm />}
      </main>
    </div>
  );
}
