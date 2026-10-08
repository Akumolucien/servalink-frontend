import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../auth/AuthContext";
import "./Auth.css";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      const u = await login(email.trim(), password);
      navigate(u.roles.includes("ADMIN") ? "/admin" : from ?? "/account", { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally { setBusy(false); }
  }

  return (
    <div className="auth"><Card>
      <h1>Welcome back</h1><p>Log in to your SERVAlink account.</p>
      <form onSubmit={submit} noValidate>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <div className="field"><label htmlFor="email">Email</label><input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="field"><label htmlFor="password">Password</label><input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <Button type="submit" disabled={busy || !email || !password}>{busy ? "Logging in…" : "Login"}</Button>
      </form>
      <p><Link to="/forgot-password">Forgot password?</Link> · <Link to="/signup">Create an account</Link></p>
    </Card></div>
  );
}
