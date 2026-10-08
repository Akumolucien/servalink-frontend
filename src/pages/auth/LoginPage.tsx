import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Mail } from "lucide-react";
import { AuthError } from "../../auth/adapter";
import { useAuth } from "../../auth/AuthContext";
import { AuthPasswordInput, AuthInput } from "../../components/auth/AuthFields";
import { Button } from "../../components/ui/Button";
import { Banner } from "../../components/ui/Display";
import { isEmail } from "../../components/ui/Field";
import { withNext } from "../../lib/redirect";

export function LoginPage() {
  const { signIn, sessionExpired } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next = {
      email: isEmail(email) ? undefined : "Enter a valid email address",
      password: password ? undefined : "Enter your password",
    };
    setErrors(next);
    if (next.email || next.password) return;
    setBusy(true);
    try {
      await signIn(email.trim().toLowerCase(), password, remember);
      // GuestOnly redirects to ?next=, /app or /admin once the session exists.
    } catch (error) {
      if (error instanceof AuthError && error.code === "UserNotConfirmedException") {
        navigate(withNext(`/verify?email=${encodeURIComponent(email.trim())}`, params.get("next")), { replace: true });
        return;
      }
      setErrors({ form: error instanceof Error ? error.message : "We couldn't log you in. Try again." });
      setBusy(false);
    }
  };

  const next = params.get("next");
  return (
    <section aria-labelledby="login-title">
      <h1 id="login-title" className="auth-title">Welcome Back</h1>
      <p className="auth-sub">Log in to your account to find or manage local services.</p>
      <form className="auth-form" onSubmit={submit} noValidate>
        {params.get("verified") && <Banner tone="success">Email verified. Log in to continue.</Banner>}
        {params.get("reset") && <Banner tone="success">Password updated. Log in with your new password.</Banner>}
        {sessionExpired && <Banner tone="warning">Your session expired. Please log in again.</Banner>}
        {errors.form && <Banner tone="danger">{errors.form}</Banner>}
        <AuthInput label="Email" placeholder="Email address" icon={<Mail size={19} />} type="email" autoComplete="email" value={email}
          error={errors.email} onChange={(e) => setEmail(e.target.value)} />
        <AuthPasswordInput label="Password" autoComplete="current-password" value={password} error={errors.password}
          onChange={(e) => setPassword(e.target.value)} />
        <div className="auth-row">
          <label className="check"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />Remember me</label>
          <Link to="/forgot-password">Forgot Password?</Link>
        </div>
        <Button type="submit" size="lg" block loading={busy} className="auth-submit">
          Login {!busy && <ArrowRight size={19} aria-hidden="true" />}
        </Button>
        <div className="auth-or" aria-hidden="true">Or</div>
        <p className="auth-switch">Don't have an account?<Link to={withNext("/register", next)}>Sign Up</Link></p>
      </form>
    </section>
  );
}
