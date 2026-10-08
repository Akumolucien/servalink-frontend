import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import "./DashboardLayout.css";

export type NavGroup = { label: string; links: { to: string; label: string; end?: boolean }[] };

export function Shell({ groups, title }: { groups: NavGroup[]; title: string }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const initials = (user?.email ?? "?").slice(0, 2).toUpperCase();

  return (
    <div className={`dash ${open ? "nav-open" : ""}`}>
      <aside id="side-nav" aria-label={title}>
        <Link className="dbrand" to="/">SERVA<span>link</span></Link>
        {groups.map((g) => (
          <nav key={g.label} aria-label={g.label} className="dnav">
            <small>{g.label}</small>
            {g.links.map((l) => <NavLink key={l.to} to={l.to} end={l.end}>{l.label}</NavLink>)}
          </nav>
        ))}
      </aside>
      {open && <button className="dash-overlay" aria-label="Close menu" onClick={() => setOpen(false)} />}
      <main>
        <header>
          <button className="menu-btn" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="side-nav" onClick={() => setOpen(!open)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
          <span className="dash-title">{title}</span>
          <span className="dash-user"><b title={user?.email}>{initials}</b>
            <button className="menu-btn logout" onClick={async () => { await logout(); navigate("/"); }}><LogOut size={16} /> Log out</button>
          </span>
        </header>
        <section><Outlet /></section>
      </main>
    </div>
  );
}
