import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  return (
    <aside className="w-64 shrink-0 bg-[var(--color-panel)] border-r border-[var(--color-border)] h-screen p-6 flex flex-col">
      <div className="flex items-center gap-2 mb-10">
        <span className="text-shield-accent text-2xl">🛡</span>
        <span className="font-bold text-lg">NetShield AI</span>
      </div>

      <nav className="flex-1 space-y-2 text-sm">
        <Link
          to="/"
          className={`block px-3 py-2 rounded ${
            location.pathname === "/"
              ? "bg-slate-800/60 text-shield-accent"
              : "hover:bg-slate-800/40 text-slate-300"
          }`}
        >
          Dashboard
        </Link>
        {user?.role === "admin" && (
          <Link
            to="/admin"
            className={`block px-3 py-2 rounded ${
              location.pathname === "/admin"
                ? "bg-slate-800/60 text-shield-accent"
                : "hover:bg-slate-800/40 text-slate-300"
            }`}
          >
            Admin Panel
          </Link>
        )}
      </nav>

      <button
        onClick={toggleTheme}
        className="mb-4 px-3 py-2 rounded text-sm text-left hover:bg-slate-800/40 text-slate-300"
      >
        {theme === "dark" ? "☀️ Light mode" : "🌙 Dark mode"}
      </button>

      <div className="border-t border-[var(--color-border)] pt-4 text-sm">
        <p className="text-slate-400">{user?.name}</p>
        <p className="text-slate-500 text-xs">{user?.email}</p>
        <p className="text-shield-accent text-xs capitalize mb-3">{user?.role}</p>
        <button
          onClick={logout}
          className="w-full text-left px-3 py-2 rounded bg-shield-danger/10 text-shield-danger hover:bg-shield-danger/20"
        >
          Log out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
