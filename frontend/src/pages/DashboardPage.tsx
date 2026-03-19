import { Link, useNavigate } from "react-router-dom";
import { clearToken, getToken } from "../lib/auth";

export function DashboardPage() {
  const navigate = useNavigate();
  const token = getToken();

  return (
    <>
      <header className="top-nav">
        <Link className="logo" to="/" aria-label="Till startsidan">
          MyFit
        </Link>
      </header>

      <main className="auth-main">
        <section className="auth-card">
          <header className="auth-header">
            <h1>Dashboard</h1>
            <p>Kommer snart: träningspass, måltider och vikt-historik.</p>
          </header>

          {!token ? (
            <p className="auth-error">Du är inte inloggad. Gå till logga in.</p>
          ) : null}

          <button
            className="cta-button secondary auth-submit"
            type="button"
            onClick={() => {
              clearToken();
              navigate("/", { replace: true });
            }}
          >
            Logga ut
          </button>
        </section>
      </main>
    </>
  );
}

