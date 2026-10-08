import { useEffect, useState, type FormEvent } from "react";
import { ExternalLink } from "lucide-react";
import { api, ApiError } from "../../api";
import { useAuth } from "../../auth/AuthContext";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Banner, PageHeader, StatusBadge } from "../../components/ui/Display";
import { TextAreaField, TextField } from "../../components/ui/Field";
import { useToast } from "../../components/ui/Overlay";
import { PROVIDER_STATUS } from "../../lib/status";

/** Provider Profile (own): only service title and description are editable (PUT /provider). */
export function OwnProviderProfilePage() {
  const { provider, reloadAccount, session } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ service_title: "", description: "" });
  const [errors, setErrors] = useState<{ title?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (provider) setForm({ service_title: provider.service_title, description: provider.description ?? "" });
  }, [provider]);
  if (!provider) return null;
  const status = PROVIDER_STATUS[provider.status];

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.service_title.trim()) { setErrors({ title: "Enter a title customers will see" }); return; }
    setErrors({}); setBusy(true);
    try {
      await api.saveProviderProfile({ service_title: form.service_title.trim(), description: form.description.trim() });
      await reloadAccount();
      toast.success("Provider profile saved");
    } catch (error) {
      setErrors({ form: error instanceof ApiError ? error.message : "We couldn't save your profile." });
    } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="Provider profile" subtitle="This is what customers see on your public profile."
        actions={<ButtonLink variant="secondary" to={`/providers/${session?.sub}`} icon={<ExternalLink size={16} />}>View public profile</ButtonLink>} />
      <div className="two-col">
        <form className="card card-pad stack" onSubmit={submit} noValidate aria-label="Provider profile">
          {errors.form && <Banner tone="danger">{errors.form}</Banner>}
          <TextField label="Service title" value={form.service_title} error={errors.title} maxLength={120} onChange={(e) => setForm({ ...form, service_title: e.target.value })} />
          <TextAreaField label="Description" value={form.description} maxLength={1500} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="row" style={{ justifyContent: "flex-end" }}><Button type="submit" loading={busy}>Save changes</Button></div>
        </form>
        <aside className="card card-pad stack-sm">
          <div className="row-between"><h3 style={{ fontSize: "1rem" }}>Status</h3><StatusBadge label={status.label} tone={status.tone} /></div>
          <dl className="kv" style={{ gridTemplateColumns: "100px 1fr" }}>
            <dt>Category</dt><dd>{provider.service_category}</dd>
            <dt>Town / city</dt><dd>{provider.city}</dd>
            <dt>Phone</dt><dd>{provider.phone || "None"}</dd>
          </dl>
          <p className="muted xs">Category and town are set when you apply. Add services for other towns from My Services.</p>
        </aside>
      </div>
    </>
  );
}
