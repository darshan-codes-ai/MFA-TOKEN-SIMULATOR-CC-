import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import LoginForm from "../components/LoginForm.jsx";
import { useAuth } from "../services/AuthContext.jsx";
import { loginRequest } from "../services/api.js";

export default function LoginPage() {
  const { loggedIn, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (loggedIn) {
    return <Navigate to="/mfa" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const result = await loginRequest(username, password);
    setLoading(false);

    if (!result.ok) {
      setError(result.status === 401 ? "Invalid username or password" : result.message);
      return;
    }

    login();
    navigate("/mfa");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-10">
      <section className="glass w-full rounded-3xl p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-wide">MFA Token Simulator</h1>
          <p className="mt-2 text-sm uppercase tracking-[0.22em] text-cyan-300">
            Secure Authentication
          </p>
        </div>
        <LoginForm
          username={username}
          password={password}
          error={error}
          loading={loading}
          onUsernameChange={setUsername}
          onPasswordChange={setPassword}
          onSubmit={handleSubmit}
        />
        <p className="mt-6 text-center text-xs text-slate-500">
          Demo login: <span className="text-slate-300">demo</span> /{" "}
          <span className="text-slate-300">mfa123</span>
        </p>
      </section>
    </main>
  );
}
