import { Link, Navigate, useNavigate } from "react-router-dom";
import { clearToken, getToken } from "../lib/auth";

export function DashboardPage() {
  const navigate = useNavigate();
  const token = getToken();
  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="dashboard-page">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">FitTracker</div>
        <nav className="dashboard-menu">
          <button className="dashboard-menu-item is-active" type="button">
            <span>▦</span> Dashboard
          </button>
          <button className="dashboard-menu-item" type="button">
            <span>🏋</span> Träning
          </button>
          <button className="dashboard-menu-item" type="button">
            <span>🍽</span> Kost
          </button>
          <button className="dashboard-menu-item" type="button">
            <span>♡</span> Livsstil
          </button>
        </nav>
        <button
          className="dashboard-logout"
          type="button"
          onClick={() => {
            clearToken();
            navigate("/", { replace: true });
          }}
        >
          Logga ut
        </button>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <p className="dashboard-topbar-title">Fitness Tracker</p>
          <Link className="dashboard-home-link" to="/">
            ⌂ Startsida
          </Link>
        </header>

        <section className="dashboard-content">
          <header className="dashboard-headline">
            <h1>Dashboard</h1>
            <p>Dagens sammanfattning</p>
          </header>

          <section className="dashboard-stats-grid">
            <article className="dashboard-stat-card">
              <span className="dashboard-stat-icon">🏋</span>
              <div>
                <h3>0</h3>
                <p>Träningspass idag</p>
              </div>
            </article>
            <article className="dashboard-stat-card">
              <span className="dashboard-stat-icon">🔥</span>
              <div>
                <h3>0</h3>
                <p>Kalorier idag</p>
              </div>
            </article>
            <article className="dashboard-stat-card">
              <span className="dashboard-stat-icon">⚖</span>
              <div>
                <h3>-</h3>
                <p>Kroppsvikt</p>
              </div>
            </article>
            <article className="dashboard-stat-card">
              <span className="dashboard-stat-icon">📈</span>
              <div>
                <h3>0</h3>
                <p>Dagars streak</p>
              </div>
            </article>
          </section>

          <section className="dashboard-actions">
            <button className="dashboard-action-btn is-primary" type="button">
              Logga träning
            </button>
            <button className="dashboard-action-btn" type="button">
              Logga måltid
            </button>
            <button className="dashboard-action-btn" type="button">
              Logga vikt
            </button>
          </section>

          <section className="dashboard-panels">
            <article className="dashboard-panel">
              <header>⚖ Viktutveckling</header>
              <div className="dashboard-panel-body">Logga vikt för att se trenden</div>
            </article>
            <article className="dashboard-panel">
              <header>📅 Träningsfrekvens (7 dagar)</header>
              <div className="dashboard-panel-body">Data visualiseras här när pass loggas</div>
            </article>
          </section>
        </section>
      </main>
    </div>
  );
}

