import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register as registerApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

const Login: React.FC = () => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "register") {
        await registerApi(name, email, password);
      }
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <form
        onSubmit={handleSubmit}
        className="bg-[var(--color-panel)] border border-[var(--color-border)] rounded-xl p-8 w-full max-w-sm"
      >
        <div className="flex items-center gap-2 mb-6 justify-center">
          <span className="text-shield-accent text-3xl">🛡</span>
          <h1 className="text-xl font-bold">NetShield AI</h1>
        </div>

        {mode === "register" && (
          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-1">Name</label>
            <input
              className="w-full bg-[var(--color-input)] border border-slate-700 rounded px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm text-slate-400 mb-1">Email</label>
          <input
            type="email"
            className="w-full bg-[var(--color-input)] border border-slate-700 rounded px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm text-slate-400 mb-1">Password</label>
          <input
            type="password"
            className="w-full bg-[var(--color-input)] border border-slate-700 rounded px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        {error && <p className="text-shield-danger text-sm mb-4">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-shield-accent text-slate-900 font-semibold rounded py-2 hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
        </button>

        <p className="text-center text-sm text-slate-400 mt-4">
          {mode === "login" ? "No account yet?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="text-shield-accent"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "Register" : "Log in"}
          </button>
        </p>
      </form>
    </div>
  );
};

export default Login;
