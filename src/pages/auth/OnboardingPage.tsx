import { useState, type FormEvent } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, MapPin, Phone, User } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { AuthInput } from "../../components/auth/AuthFields";
import { Button } from "../../components/ui/Button";
import { Banner } from "../../components/ui/Display";
import { hasErrors, type Errors } from "../../components/ui/Field";
import { useToast } from "../../components/ui/Overlay";
import { FullPageLoading } from "../../auth/guards";
import { safeNext } from "../../lib/redirect";

/** Shown when GET /profile returns 404: the account exists in Cognito but not yet in ServaLink. */
export function OnboardingPage() {
  const { profile, accountLoading, saveProfile, isAdmin, session } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const destination = safeNext(params.get("next"), "/app");
  const [form, setForm] = useState({ full_name: "", city: "", phone: "" });
  const [errors, setErrors] = useState<Errors<"full_name" | "city" | "phone" | "form">>({});
  const [busy, setBusy] = useState(false);

  if (isAdmin) return <Navigate to="/admin" replace />;
  if (accountLoading || profile === undefined) return <FullPageLoading />;
  if (profile) return <Navigate to={destination} replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (!form.full_name.trim()) next.full_name = "Enter your full name";
    if (!form.city.trim()) next.city = "Enter your town or city";
    if (form.phone.trim() && form.phone.replace(/\D/g, "").length < 8) next.phone = "Enter a valid phone number";
    setErrors(next);
    if (hasErrors(next)) return;
    setBusy(true);
    try {
      await saveProfile({ full_name: form.full_name.trim(), city: form.city.trim(), phone: form.phone.trim() });
      toast.success("Profile saved");
      navigate(destination, { replace: true });
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : "We couldn't save your profile." });
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="onboarding-title">
      <h1 id="onboarding-title" className="auth-title">Finish setting up your profile</h1>
      <p className="auth-sub">Signed in as {session?.email}. Tell us where you're based so providers know who they're helping.</p>
      <form className="auth-form" onSubmit={submit} noValidate>
        {errors.form && <Banner tone="danger">{errors.form}</Banner>}
        <AuthInput label="Full name" icon={<User size={19} />} autoComplete="name" value={form.full_name} error={errors.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        <AuthInput label="Town / city" placeholder="Town / city (e.g. Buea)" icon={<MapPin size={19} />} autoComplete="address-level2" value={form.city} error={errors.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        <AuthInput label="Phone number" placeholder="Phone (optional)" icon={<Phone size={19} />} type="tel" autoComplete="tel" value={form.phone} error={errors.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Button type="submit" size="lg" block loading={busy} className="auth-submit">Save and continue {!busy && <ArrowRight size={19} aria-hidden="true" />}</Button>
      </form>
    </section>
  );
}
