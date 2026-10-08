import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, KeyRound } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { withNext } from "../../lib/redirect";
import { isLocalIntegration } from "../../config/env";
import { AuthInput } from "../../components/auth/AuthFields";
import { Button } from "../../components/ui/Button";
import { Banner } from "../../components/ui/Display";

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
      <section aria-labelledby="verify-title">
        <h1 id="verify-title" className="auth-title">Verify your email</h1>
        <p className="auth-sub">Start by creating an account or logging in.</p>
        <div className="auth-form"><Link to="/register" className="btn btn-primary btn-lg btn-block auth-submit">Create Account</Link></div>
      </section>
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
    <section aria-labelledby="verify-title">
      <h1 id="verify-title" className="auth-title">Check your email</h1>
      <p className="auth-sub">We sent a verification code to <strong>{email}</strong>. Enter it below to activate your account.</p>
      <form className="auth-form" onSubmit={submit} noValidate>
        {isLocalIntegration && <Banner tone="info">Local integration mode: the verification code is <strong>123456</strong>.</Banner>}
        {notice && <Banner tone="success">{notice}</Banner>}
        {error && <Banner tone="danger">{error}</Banner>}
        <AuthInput label="Verification code" placeholder="6-digit code" icon={<KeyRound size={19} />} inputMode="numeric"
          autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} />
        <Button type="submit" size="lg" block loading={busy} className="auth-submit">
          Verify email {!busy && <ArrowRight size={19} aria-hidden="true" />}
        </Button>
        <div className="auth-row" style={{ justifyContent: "center" }}>
          <Button variant="ghost" size="sm" onClick={resend} disabled={cooldown > 0}>{cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}</Button>
        </div>
      </form>
    </section>
  );
}
