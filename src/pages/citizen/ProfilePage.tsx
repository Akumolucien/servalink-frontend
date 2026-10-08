import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError, uploadImage } from "../../api";
import { useAuth } from "../../auth/AuthContext";
import { ImagePicker } from "../../components/domain/Provider";
import { Button } from "../../components/ui/Button";
import { Avatar, Banner, PageHeader } from "../../components/ui/Display";
import { hasErrors, TextField, type Errors } from "../../components/ui/Field";
import { useToast } from "../../components/ui/Overlay";
import { formatDate } from "../../lib/format";

export function ProfilePage() {
  const { profile, saveProfile, session, hasProviderTools } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ full_name: "", city: "", phone: "" });
  const [photo, setPhoto] = useState<File | null>(null);
  const [ownPhoto, setOwnPhoto] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors<"full_name" | "city" | "phone" | "form">>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name, city: profile.city, phone: profile.phone ?? "" });
  }, [profile]);
  // GET /profile returns only the image key, so a photo URL is available just for approved providers.
  useEffect(() => {
    if (hasProviderTools && session) api.provider(session.sub).then((p) => setOwnPhoto(p.photo_url)).catch(() => {});
  }, [hasProviderTools, session]);

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
      const profile_image_key = photo ? await uploadImage(photo, "PROFILE_IMAGE") : undefined;
      await saveProfile({
        full_name: form.full_name.trim(), city: form.city.trim(), phone: form.phone.trim(),
        ...(profile_image_key ? { profile_image_key } : {}),
      });
      setPhoto(null);
      toast.success("Profile saved");
    } catch (error) {
      setErrors({ form: error instanceof ApiError ? error.message : "We couldn't save your profile. Try again." });
    } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="My profile" subtitle="Your details are shared with providers when you book them." />
      <div className="two-col">
        <form className="card card-pad stack" onSubmit={submit} noValidate aria-label="Profile">
          {errors.form && <Banner tone="danger">{errors.form}</Banner>}
          <div className="form-grid">
            <TextField className="span-2" label="Full name" autoComplete="name" value={form.full_name} error={errors.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            <TextField label="Town / city" autoComplete="address-level2" value={form.city} error={errors.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <TextField label="Phone number" optional type="tel" placeholder="+237 6XX XXX XXX" autoComplete="tel" value={form.phone} error={errors.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <TextField label="Email" value={session?.email ?? ""} disabled readOnly hint="Your email is your login and can't be changed here." />
          <ImagePicker label="Profile photo" file={photo} onChange={setPhoto}
            hint={profile?.profile_image_key ? "A photo is saved. Choose a new one to replace it." : "JPEG, PNG or WEBP, up to 10 MB."} />
          <div className="row" style={{ justifyContent: "flex-end" }}><Button type="submit" loading={busy}>Save changes</Button></div>
        </form>
        <aside className="card card-pad stack-sm" style={{ justifyItems: "start" }}>
          <Avatar name={profile?.full_name} src={ownPhoto} size={72} />
          <strong>{profile?.full_name}</strong>
          <span className="muted small">{session?.email}</span>
          {profile?.created_at && <span className="muted xs">Member since {formatDate(profile.created_at)}</span>}
        </aside>
      </div>
    </>
  );
}
