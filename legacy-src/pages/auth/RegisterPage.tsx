import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { confirmSignUp, resendSignUpCode, signUp } from "aws-amplify/auth";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import "./Auth.css";

const friendly = (e: unknown) => {
  const err = e as Error;
  if (err.name === "UsernameExistsException") return "An account with this email already exists. Try logging in instead.";
  if (err.name === "InvalidPasswordException") return err.message || "That password doesn't meet the requirements.";
  if (err.name === "CodeMismatchException") return "That code isn't correct. Please check it and try again.";
  if (err.name === "ExpiredCodeException") return "That code has expired. Request a new one.";
  return "Something went wrong. Please try again.";
};

export function RegisterPage() {
  const [step, setStep] = useState<"form" | "verify" | "done">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<void>) {
    setError(""); setInfo(""); setBusy(true);
    try { await fn(); } catch (e) { setError(friendly(e)); } finally { setBusy(false); }
  }
  const submitForm = (e: FormEvent) => { e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    run(async () => { await signUp({ username: email.trim(), password, options: { userAttributes: { email: email.trim() } } }); setStep("verify"); });
  };
  const submitCode = (e: FormEvent) => { e.preventDefault(); run(async () => { await confirmSignUp({ username: email.trim(), confirmationCode: code.trim() }); setStep("done"); }); };
  const resend = () => run(async () => { await resendSignUpCode({ username: email.trim() }); setInfo("We've sent a new code to your email."); });

  return (
    <div className="auth"><Card>
      {step === "form" && <>
        <h1>Create your account</h1><p>One account lets you find providers, book services and leave reviews.</p>
        <form onSubmit={submitForm} noValidate>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <div className="field"><label htmlFor="email">Email</label><input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="field"><label htmlFor="password">Password</label><input id="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <div className="field"><label htmlFor="confirm">Confirm password</label><input id="confirm" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
          <Button type="submit" disabled={busy}>{busy ? "Creating account…" : "Sign Up"}</Button>
        </form>
        <p>Already have an account? <Link to="/login">Log in</Link></p>
      </>}
      {step === "verify" && <>
        <h1>Check your email</h1><p>We sent a verification code to <b>{email}</b>.</p>
        <form onSubmit={submitCode} noValidate>
          {error && <p className="auth-error" role="alert">{error}</p>}
          {info && <p role="status">{info}</p>}
          <div className="field"><label htmlFor="code">Verification code</label><input id="code" inputMode="numeric" autoComplete="one-time-code" required value={code} onChange={(e) => setCode(e.target.value)} /></div>
          <Button type="submit" disabled={busy || !code}>{busy ? "Verifying…" : "Verify email"}</Button>
        </form>
        <p>Didn't get it? <button type="button" className="link-btn" onClick={resend} disabled={busy}>Send a new code</button></p>
      </>}
      {step === "done" && <>
        <h1>Email verified</h1><p>Your account is ready. You can log in now.</p>
        <Link className="btn-link" to="/login">Go to Login</Link>
      </>}
    </Card></div>
  );
}
