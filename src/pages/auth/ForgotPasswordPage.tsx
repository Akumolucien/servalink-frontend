import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, KeyRound, Mail } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { isLocalIntegration } from "../../config/env";
import { AuthInput, AuthPasswordInput } from "../../components/auth/AuthFields";
import { Button } from "../../components/ui/Button";
import { Banner } from "../../components/ui/Display";
import { isEmail, passwordProblem } from "../../components/ui/Field";

export function ForgotPasswordPage() {
  const { adapter } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; code?: string; password?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  const requestCode = async (event: FormEvent) => {
    event.preventDefault();
    if (!isEmail(email)) { setErrors({ email: "Enter a valid email address" }); return; }
    setBusy(true); setErrors({});
    try {
      await adapter!.forgotPassword(email.trim().toLowerCase());
      setStep("reset");
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : "We couldn't send a code." });
    } finally { setBusy(false); }
  };

  const reset = async (event: FormEvent) => {
    event.preventDefault();
    const next = { code: code.trim() ? undefined : "Enter the code from your email", password: passwordProblem(password) };
    setErrors(next);
    if (next.code || next.password) return;
    setBusy(true);
    try {
      await adapter!.confirmForgotPassword(email.trim().toLowerCase(), code, password);
      navigate(`/login?reset=1&email=${encodeURIComponent(email.trim())}`, { replace: true });
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : "We couldn't reset your password." });
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="forgot-title">
      <h1 id="forgot-title" className="auth-title">Reset your password</h1>
      <p className="auth-sub">{step === "email" ? "Enter your email and we'll send you a code." : `Enter the code we sent to ${email}.`}</p>
      {step === "email" ? (
        <form className="auth-form" onSubmit={requestCode} noValidate>
          {errors.form && <Banner tone="danger">{errors.form}</Banner>}
          <AuthInput label="Email" placeholder="Email address" icon={<Mail size={19} />} type="email" autoComplete="email" value={email} error={errors.email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" size="lg" block loading={busy} className="auth-submit">Send code {!busy && <ArrowRight size={19} aria-hidden="true" />}</Button>
          <p className="auth-back"><Link to="/login">Back to log in</Link></p>
        </form>
      ) : (
        <form className="auth-form" onSubmit={reset} noValidate>
          {isLocalIntegration && <Banner tone="info">Local integration mode: the code is <strong>123456</strong>.</Banner>}
          {errors.form && <Banner tone="danger">{errors.form}</Banner>}
          <AuthInput label="Verification code" placeholder="6-digit code" icon={<KeyRound size={19} />} inputMode="numeric" autoComplete="one-time-code" value={code} error={errors.code} onChange={(e) => setCode(e.target.value)} />
          <AuthPasswordInput label="New password" autoComplete="new-password" value={password} error={errors.password}
            hint="At least 8 characters with uppercase, lowercase and a number." onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" size="lg" block loading={busy} className="auth-submit">Update password {!busy && <ArrowRight size={19} aria-hidden="true" />}</Button>
          <p className="auth-back"><Link to="/login">Back to log in</Link></p>
        </form>
      )}
    </section>
  );
}
