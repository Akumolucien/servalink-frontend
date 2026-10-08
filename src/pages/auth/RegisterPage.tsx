import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { withNext } from "../../lib/redirect";
import { useAuth, rememberPendingProfile } from "../../auth/AuthContext";
import { Button } from "../../components/ui/Button";
import { Banner } from "../../components/ui/Display";
import { isEmail, passwordProblem, PasswordField, TextField, hasErrors, type Errors } from "../../components/ui/Field";

type Key = "name" | "email" | "phone" | "city" | "password" | "confirm" | "form";

export function RegisterPage() {
  const { adapter } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const nextPath = params.get("next");
  const [form, setForm] = useState({ name: "", email: "", phone: "", city: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Errors<Key>>({});
  const [busy, setBusy] = useState(false);
  const set = (key: keyof typeof form) => (event: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [key]: event.target.value }));
    setErrors((e) => ({ ...e, [key]: undefined, form: undefined }));
  };

  const validate = (): Errors<Key> => {
    const next: Errors<Key> = {};
    if (!form.name.trim()) next.name = "Enter your full name";
    if (!isEmail(form.email)) next.email = "Enter a valid email address";
    if (form.phone.trim() && form.phone.replace(/\D/g, "").length < 8) next.phone = "Enter a valid phone number, for example +237 6XX XXX XXX";
    if (!form.city.trim()) next.city = "Enter your town or city";
    const problem = passwordProblem(form.password);
    if (problem) next.password = problem;
    if (form.confirm !== form.password) next.confirm = "The passwords don't match";
    return next;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    if (hasErrors(next) || !adapter) return;
    setBusy(true);
    try {
      const email = form.email.trim().toLowerCase();
      await adapter.signUp(email, form.password);
      // Profile details are saved to ServaLink after the first login (PUT /profile needs a token).
      rememberPendingProfile({ email, full_name: form.name.trim(), city: form.city.trim(), phone: form.phone.trim() });
      navigate(withNext(`/verify?email=${encodeURIComponent(email)}`, nextPath));
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : "We couldn't create your account. Try again." });
      setBusy(false);
    }
  };

  return (
    <section className="card auth-card" style={{ width: "min(560px, 100%)" }} aria-labelledby="register-title">
      <h1 id="register-title">Create your ServaLink account</h1>
      <p className="sub">Create your account to find or offer services.</p>
      <form className="stack" onSubmit={submit} noValidate>
        {errors.form && (
          <Banner tone="danger" action={errors.form.includes("already exists") ? <Link className="small nowrap" to="/login">Log in</Link> : undefined}>{errors.form}</Banner>
        )}
        <TextField label="Full name" placeholder="Enter your full name" autoComplete="name" value={form.name} error={errors.name} onChange={set("name")} />
        <TextField label="Email" type="email" placeholder="name@example.com" autoComplete="email" value={form.email} error={errors.email} onChange={set("email")} />
        <div className="form-grid">
          <TextField label="Phone number" optional type="tel" placeholder="+237 6XX XXX XXX" autoComplete="tel" value={form.phone} error={errors.phone} onChange={set("phone")} />
          <TextField label="Town / city" placeholder="e.g. Buea" autoComplete="address-level2" value={form.city} error={errors.city} onChange={set("city")} />
        </div>
        <PasswordField label="Password" autoComplete="new-password" value={form.password} error={errors.password}
          hint="At least 8 characters with uppercase, lowercase and a number." onChange={set("password")} />
        <PasswordField label="Confirm password" autoComplete="new-password" value={form.confirm} error={errors.confirm} onChange={set("confirm")} />
        <Button type="submit" size="lg" block loading={busy}>Create account</Button>
        <p className="center">Already have an account? <Link to={withNext("/login", nextPath)}>Log in</Link></p>
      </form>
    </section>
  );
}
