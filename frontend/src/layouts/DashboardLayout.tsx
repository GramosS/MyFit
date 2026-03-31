// Gemensam ram för inloggade vyer.
// Toppmeny (tabs), utloggning och <Outlet /> för undersidor.
// Saknar token → redirect till login.
import { Link, NavLink, Outlet, Navigate, useNavigate } from "react-router-dom";
import { clearToken, getToken } from "../lib/auth";

export function DashboardLayout() {
  const token = getToken();
  const navigate = useNavigate();
  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="dashboard-page">
      <header className="dashboard-topbar">
        <div className="dashboard-topbar-left">
          <span className="dashboard-brand">MyFit</span>
        </div>

        <nav className="dashboard-tabs" aria-label="Dashboard navigation">
          <NavLink to="/dashboard" end className={navClass}>
            Dashboard
          </NavLink>
          <NavLink to="/dashboard/training" className={navClass}>
            Träning
          </NavLink>
          <NavLink to="/dashboard/nutrition" className={navClass}>
            Kost
          </NavLink>
          <NavLink to="/dashboard/lifestyle" className={navClass}>
            Livsstil
          </NavLink>
        </nav>

        <div className="dashboard-topbar-right">
          <Link className="dashboard-home-link" to="/">
            Startsida
          </Link>
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
        </div>
      </header>

      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
}

function navClass({ isActive }: { isActive: boolean }) {
  return "dashboard-tab" + (isActive ? " is-active" : "");
}
