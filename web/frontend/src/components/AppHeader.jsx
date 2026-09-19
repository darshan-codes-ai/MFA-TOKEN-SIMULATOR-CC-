import { Shield } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../services/AuthContext.jsx";

export default function AppHeader() {
  const { logout, mfaVerified } = useAuth();

  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5">
      <div className="flex items-center gap-3">
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-2 text-cyan-300">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-wide text-slate-100">MFA Token Simulator</p>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Secure Authentication</p>
        </div>
      </div>
      <nav className="flex items-center gap-3 text-sm">
        <NavLink
          to="/mfa"
          className={({ isActive }) =>
            `rounded-lg px-3 py-1.5 ${isActive ? "text-cyan-300" : "text-slate-400 hover:text-slate-200"}`
          }
        >
          Token
        </NavLink>
        {mfaVerified ? (
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `rounded-lg px-3 py-1.5 ${isActive ? "text-cyan-300" : "text-slate-400 hover:text-slate-200"}`
            }
          >
            Dashboard
          </NavLink>
        ) : null}
        <button
          type="button"
          onClick={logout}
          className="rounded-lg px-3 py-1.5 text-slate-400 hover:text-slate-200"
        >
          Logout
        </button>
      </nav>
    </header>
  );
}
