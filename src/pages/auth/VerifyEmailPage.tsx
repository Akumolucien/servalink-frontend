import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { withNext } from "../../lib/redirect";
import { isLocalIntegration } from "../../config/env";
import { Button } from "../../components/ui/Button";
import { Banner } from "../../components/ui/Display";
import { TextField } from "../../components/ui/Field";

export function VerifyEmailPage() {
  const { adapter } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get("email") ?? "";
  const next = params.get("next");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  if (!email) {
    return (
      <section className="card auth-card"><h1>Verify your email</h1>
        <p className="sub">Start by creating an account or logging in.</p>
        <div className="row" style={{ justifyContent: "center" }}><Link to="/register" className="btn btn-primary">Create account</Link></div></section>
    );
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!code.trim()) { setError("Enter the code from your email"); return; }
    setBusy(true); setError(undefined);
    try {
      await adapter!.confirmSignUp(email, code);
      navigate(withNext(`/login?verified=1&email=${encodeURIComponent(email)}`, next), { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't verify that code.");
      setBusy(false);
    }
  };

  const resend = async () => {
    setError(undefined); setNotice(undefined);
    try {
      await adapter!.resendCode(email);
      setNotice("We sent a new code. Check your inbox.");
      setCooldown(30);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't send a new code.");
    }
  };

  return (
    <section className="card auth-card" aria-labelledby="verify-title">
      <div className="logo"><span className="state-icon" style={{ width: 52, height: 52, borderRadius: 14, display: "grid", placeItems: "center", background: "var(--green-50)", color: "var(--green-700)" }}><MailCheck size={26} aria-hidden="true" /></span></div>
      <h1 id="verify-title">Check your email</h1>
      <p className="sub">We sent a verification code to <strong>{email}</strong>.</p>
      <form className="stack" onSubmit={submit} noValidate>
        {isLocalIntegration && <Banner tone="info">Local integration mode: the verification code is <strong>123456</strong>.</Banner>}
        {notice && <Banner tone="success">{notice}</Banner>}
        {error && <Banner tone="danger">{error}</Banner>}
        <TextField label="Verification code" inputMode="numeric" autoComplete="one-time-code" placeholder="6-digit code" value={code}
          onChange={(e) => setCode(e.target.value)} />
        <Button type="submit" size="lg" block loading={busy}>Verify email</Button>
        <div className="row" style={{ justifyContent: "center" }}>
          <Button variant="ghost" size="sm" onClick={resend} disabled={cooldown > 0}>{cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}</Button>
        </div>
      </form>
    </section>
  );
}
