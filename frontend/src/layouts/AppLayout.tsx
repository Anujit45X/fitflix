import { NavLink, Outlet, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Utensils,
  Dumbbell,
  Activity,
  UserRound,
  LogOut,
  Layers,
} from "lucide-react";
import { useState } from "react";
import { useSession } from "../services/session";
const destinations = [
  ["/today", "Today", LayoutDashboard],
  ["/diary", "Food", Utensils],
  ["/workouts", "Workouts", Dumbbell],
  ["/progress", "Progress", Activity],
  ["/profile", "Profile", UserRound],
] as const;
export default function AppLayout() {
  const { me, logout } = useSession(),
    [error, setError] = useState("");
  async function signout() {
    try {
      await logout();
    } catch {
      setError("Could not sign out. Check your connection and try again.");
    }
  }
  return (
    <div className="app">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className="sidebar">
        <NavLink to="/today" className="brand">
          fitflix<span>✳</span>
        </NavLink>
        <div className="nav-label">YOUR EVERYDAY</div>
        <nav aria-label="Main navigation">
          {destinations.map(([path, label, Icon]) => (
            <NavLink end key={path} to={path}>
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="nav-label">MAKE IT YOURS</div>
        <nav aria-label="More features">
          <NavLink to="/thali">Build my thali</NavLink>
          <NavLink to="/planner">Saved meals</NavLink>
          <NavLink to="/analytics">Insights & trends</NavLink>
          <NavLink to="/settings">Account settings</NavLink>
          {me.user.role !== "USER" && (
            <NavLink to="/product">
              <Layers size={18} />
              Product analytics
            </NavLink>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="mini-note">
            Small steps.
            <br />
            <strong>Lasting change.</strong>
            <span className="little-sun">✳</span>
          </div>
          <div className="user-line">
            <div className="avatar">{me.user.name[0]}</div>
            <div>
              <strong>{me.user.name}</strong>
              <small>
                {me.user.demo ? "Demo account" : "Your personal space"}
              </small>
            </div>
            <button aria-label="Sign out" onClick={signout}>
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
      <main id="main-content" className="main">
        <div className="topbar">
          <span>YOUR HEALTH, IN FOCUS</span>
          <Link to="/thali">Build my thali ↗</Link>
          <span className="pill">
            {me.user.demo ? "DEMO DATA" : "ONE DAY AT A TIME"}
          </span>
          <button
            className="mobile-signout"
            aria-label="Sign out"
            onClick={signout}
          >
            <LogOut size={18} />
          </button>
        </div>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <Outlet />
        <footer>
          Fitflix · General adult wellness, at your pace.{" "}
          <Link to="/settings">Settings</Link> ·{" "}
          <Link to="/privacy">Privacy</Link>
        </footer>
      </main>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {destinations.map(([path, label, Icon]) => (
          <NavLink key={path} to={path}>
            <Icon size={21} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
