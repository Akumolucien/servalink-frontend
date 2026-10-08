import { useState, type FormEvent } from "react";
import { Hourglass, RefreshCw, ShieldX } from "lucide-react";
import { api, ApiError, type ProviderRecord } from "../../api";
import { useAuth } from "../../auth/AuthContext";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Banner, EmptyState, PageHeader, StatusBadge } from "../../components/ui/Display";
import { hasErrors, SelectField, TextAreaField, TextField, type Errors } from "../../components/ui/Field";
import { Modal, useToast } from "../../components/ui/Overlay";
import { formatDateTime } from "../../lib/format";
import { PROVIDER_STATUS, REQUEST_STATUS } from "../../lib/status";
import { useResource } from "../../lib/useResource";

export function BecomeProviderPage() {
  const { provider, profile, hasProviderTools, needsSessionRefresh, reloadAccount, refreshSession } = useAuth();
  const toast = useToast();
  const [checking, setChecking] = useState(false);

  if (provider) {
    const status = PROVIDER_STATUS[provider.status];
    const check = async () => {
      setChecking(true);
      await reloadAccount();
      const ok = await refreshSession();
      setChecking(false);
      toast.success(ok ? "You're approved. Provider Tools are unlocked." : "Status updated");
    };
    return (
      <>
        <PageHeader title="Provider application" subtitle="Your provider status is tied to your existing account." />
        <div className="stack" style={{ maxWidth: 720 }}>
          {provider.status === "PENDING" && (
            <div className="card"><EmptyState icon={<Hourglass size={24} />} title="Your application is pending approval"
              action={<Button variant="secondary" icon={<RefreshCw size={16} />} loading={checking} onClick={check}>Check status</Button>}>
              An administrator reviews every application. You'll be able to use Provider Tools as soon as it's approved. Check back here, or log in again later.
            </EmptyState></div>
          )}
          {provider.status === "APPROVED" && (hasProviderTools ? (
            <Banner tone="success" action={<ButtonLink to="/app/provider" size="sm">Open Provider Tools</ButtonLink>}>
              <strong>You're an approved provider.</strong><span>Manage services, booking requests and your work gallery.</span>
            </Banner>
          ) : needsSessionRefresh ? (
            <Banner tone="success" action={<Button size="sm" loading={checking} onClick={check}>Refresh access</Button>}>
              <strong>Your application was approved.</strong><span>Refresh your access to unlock Provider Tools.</span>
            </Banner>
          ) : null)}
          {(provider.status === "REJECTED" || provider.status === "SUSPENDED" || provider.status === "BANNED") && (
            <div className="card"><EmptyState icon={<ShieldX size={24} />} title={`Application status: ${status.label}`}>
              {provider.status_reason ? `Reason from the administrator: ${provider.status_reason}` : "Provider Tools aren't available for this account."}
            </EmptyState></div>
          )}
          <ApplicationSummary provider={provider} />
        </div>
      </>
    );
  }
  return (
    <>
      <PageHeader title="Become a provider" subtitle="Apply once with your existing account. There's no second login." />
      <ApplicationForm defaultPhone={profile?.phone ?? ""} city={profile?.city ?? ""} />
    </>
  );
}

function ApplicationSummary({ provider }: { provider: ProviderRecord }) {
  const status = PROVIDER_STATUS[provider.status];
  return (
    <section className="card card-pad stack" aria-label="Application details">
      <div className="row-between"><h3 style={{ fontSize: "1rem" }}>Your application</h3><StatusBadge label={status.label} tone={status.tone} /></div>
      <dl className="kv">
        <dt>Category</dt><dd>{provider.service_category}</dd>
        <dt>Service title</dt><dd>{provider.service_title}</dd>
        <dt>Description</dt><dd style={{ whiteSpace: "pre-line" }}>{provider.description || "None"}</dd>
        <dt>Phone</dt><dd>{provider.phone || "None"}</dd>
        <dt>Town / city</dt><dd>{provider.city}</dd>
        <dt>Submitted</dt><dd>{formatDateTime(provider.created_at)}</dd>
      </dl>
    </section>
  );
}

type Key = "category" | "title" | "description" | "phone" | "form";

function ApplicationForm({ defaultPhone, city }: { defaultPhone: string; city: string }) {
  const { reloadAccount } = useAuth();
  const toast = useToast();
  const categories = useResource(() => api.categories(), []);
  const requests = useResource(() => api.categoryRequests(), []);
  const [form, setForm] = useState({ category: "", title: "", description: "", phone: defaultPhone });
  const [errors, setErrors] = useState<Errors<Key>>({});
  const [busy, setBusy] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const update = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined, form: undefined }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next: Errors<Key> = {};
    if (!form.category) next.category = "Choose your service category";
    if (!form.title.trim()) next.title = "Enter a title customers will see";
    if (form.description.trim().length < 20) next.description = "Describe your services in at least 20 characters";
    if (form.phone.trim() && form.phone.replace(/\D/g, "").length < 8) next.phone = "Enter a valid phone number";
    setErrors(next);
    if (hasErrors(next)) return;
    setBusy(true);
    try {
      await api.applyAsProvider({ service_category: form.category, service_title: form.title.trim(), description: form.description.trim(), phone: form.phone.trim() });
      toast.success("Application submitted");
      await reloadAccount();
    } catch (error) {
      setErrors({ form: error instanceof ApiError ? error.message : "We couldn't submit your application. Try again." });
      setBusy(false);
    }
  };

  const list = categories.data ?? [];
  return (
    <div className="two-col">
      <form className="card card-pad stack" onSubmit={submit} noValidate aria-label="Provider application">
        {errors.form && <Banner tone="danger">{errors.form}</Banner>}
        <SelectField label="Service category" value={form.category} error={errors.category}
          hint={!categories.loading && list.length === 0 ? "No categories are available yet. Request one below." : undefined}
          onChange={(e) => update("category", e.target.value)} disabled={categories.loading || list.length === 0}>
          <option value="">{categories.loading ? "Loading categories…" : "Choose a category"}</option>
          {list.map((c) => <option key={c.category_id} value={c.category_name}>{c.category_name}</option>)}
        </SelectField>
        <p className="small" style={{ marginTop: -8 }}>
          Can't find your category? <button type="button" className="btn-link" style={{ background: "none", border: 0, padding: 0, color: "var(--green-700)", fontWeight: 600, textDecoration: "underline" }} onClick={() => setRequesting(true)}>Request a new category</button>
        </p>
        <TextField label="Service title" placeholder="e.g. John Plumbing Services" value={form.title} error={errors.title} maxLength={120}
          hint="Shown on your public profile and in search results." onChange={(e) => update("title", e.target.value)} />
        <TextAreaField label="Description" value={form.description} error={errors.description} maxLength={1500}
          placeholder="What do you do, and what makes you reliable?" onChange={(e) => update("description", e.target.value)} />
        <TextField label="Phone number" optional type="tel" placeholder="+237 6XX XXX XXX" value={form.phone} error={errors.phone} onChange={(e) => update("phone", e.target.value)} />
        <p className="hint-box">You'll be listed in <strong>{city || "your profile town"}</strong>, the town saved on your profile.</p>
        <div className="row" style={{ justifyContent: "flex-end" }}><Button type="submit" loading={busy}>Submit application</Button></div>
      </form>

      <aside className="stack">
        <div className="card card-pad stack-sm">
          <h3 style={{ fontSize: "1rem" }}>What happens next</h3>
          <ol className="small muted" style={{ paddingLeft: 18, margin: 0, display: "grid", gap: 6 }}>
            <li>An administrator reviews your application.</li>
            <li>Once approved, you refresh your access and Provider Tools appear.</li>
            <li>Add your services and start receiving booking requests.</li>
          </ol>
        </div>
        {(requests.data?.length ?? 0) > 0 && (
          <div className="card card-pad stack-sm">
            <h3 style={{ fontSize: "1rem" }}>Your category requests</h3>
            {requests.data!.map((r) => (
              <div className="row-between" key={r.request_id}>
                <span className="small">{r.proposed_name}</span>
                <StatusBadge label={REQUEST_STATUS[r.status].label} tone={REQUEST_STATUS[r.status].tone} />
              </div>
            ))}
            <p className="muted xs">Approved categories appear in the list above.</p>
          </div>
        )}
      </aside>
      <CategoryRequestModal open={requesting} onClose={() => setRequesting(false)} onDone={requests.reload} />
    </div>
  );
}

export function CategoryRequestModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Errors<"name" | "description" | "form">>({});
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Enter the category name";
    if (!description.trim()) next.description = "Tell us what this category covers";
    setErrors(next);
    if (hasErrors(next)) return;
    setBusy(true);
    try {
      await api.requestCategory({ proposed_name: name.trim(), description: description.trim() });
      toast.success("Category request submitted");
      setName(""); setDescription(""); onDone(); onClose();
    } catch (error) {
      setErrors({ form: error instanceof ApiError ? error.message : "We couldn't submit your request." });
    } finally { setBusy(false); }
  };

  return (
    <Modal open={open} title="Request a new category" onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <div className="modal-body form stack">
          <p className="muted small">An administrator will review it. A new category can't be used until it's approved.</p>
          {errors.form && <Banner tone="danger">{errors.form}</Banner>}
          <TextField label="Category name" value={name} error={errors.name} onChange={(e) => setName(e.target.value)} />
          <TextAreaField label="What does it cover?" value={description} error={errors.description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="modal-foot"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" loading={busy}>Submit request</Button></div>
      </form>
    </Modal>
  );
}
