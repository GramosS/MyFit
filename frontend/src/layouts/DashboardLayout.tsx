// Gemensam ram för inloggade vyer.
// Sidomeny, utloggning och <Outlet /> för undersidor.
// Saknar token → redirect till login.
import { Link, NavLink, Outlet, Navigate, useNavigate } from "react-router-dom";
import { clearToken, getToken } from "../lib/auth";

export function DashboardLayout() {
  const token = getToken();
  const navigate = useNavigate();
  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="dashboard-page">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">FitTracker</div>
        <nav className="dashboard-menu">
          <NavLink to="/dashboard" end className={navClass}>
            <span>▦</span> Dashboard
          </NavLink>
          <NavLink to="/dashboard/training" className={navClass}>
            <span>🏋</span> Träning
          </NavLink>
          <NavLink to="/dashboard/nutrition" className={navClass}>
            <span>🍽</span> Kost
          </NavLink>
          <NavLink to="/dashboard/lifestyle" className={navClass}>
            <span>♡</span> Livsstil
          </NavLink>
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
        <Outlet />
      </main>
    </div>
  );
}

function navClass({ isActive }: { isActive: boolean }) {
  return "dashboard-menu-item" + (isActive ? " is-active" : "");
}
