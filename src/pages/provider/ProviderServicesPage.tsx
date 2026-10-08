import { useState, type FormEvent } from "react";
import { MapPin, Pencil, Plus, Trash2, Wrench } from "lucide-react";
import { api, ApiError, type Service } from "../../api";
import { useAuth } from "../../auth/AuthContext";
import { Button } from "../../components/ui/Button";
import { Banner, CardSkeleton, EmptyState, ErrorState, PageHeader } from "../../components/ui/Display";
import { hasErrors, SelectField, TextAreaField, TextField, type Errors } from "../../components/ui/Field";
import { Modal, useConfirm, useToast } from "../../components/ui/Overlay";
import { useResource } from "../../lib/useResource";
import { CategoryRequestModal } from "../citizen/BecomeProviderPage";

export function ProviderServicesPage() {
  const { session } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const services = useResource(() => api.myServices(session!.sub), [session?.sub]);
  const [editing, setEditing] = useState<Service | "new" | null>(null);

  const remove = async (service: Service) => {
    const ok = await confirm({
      title: "Delete this service?", confirmLabel: "Delete service", tone: "danger",
      message: `"${service.name}" will no longer appear in search or be bookable. Existing bookings are not affected.`,
    });
    if (!ok) return;
    try { await api.deleteService(service.service_id); toast.success("Service deleted"); }
    catch (error) { toast.error(error instanceof ApiError ? error.message : "We couldn't delete that service."); }
    await services.reload();
  };

  return (
    <>
      <PageHeader title="My services" subtitle="The services customers can book from you."
        actions={<Button icon={<Plus size={16} />} onClick={() => setEditing("new")}>Add a service</Button>} />
      {services.loading && !services.data ? <CardSkeleton rows={2} />
        : services.error ? <ErrorState error={services.error} onRetry={services.reload} title="We couldn't load your services" />
          : services.data!.length === 0 ? (
            <div className="card"><EmptyState icon={<Wrench size={24} />} title="No services yet"
              action={<Button onClick={() => setEditing("new")}>Add your first service</Button>}>
              Customers find you through the services you list. Add what you offer and the town you work in.
            </EmptyState></div>
          ) : (
            <div className="card">
              {services.data!.map((s) => (
                <div className="service-row" key={s.service_id}>
                  <div style={{ minWidth: 0, flex: "1 1 260px" }}>
                    <h3 style={{ fontSize: "1rem" }}>{s.name}</h3>
                    {s.description && <p className="muted small">{s.description}</p>}
                    <p className="muted xs row" style={{ gap: 4, marginTop: 4 }}><MapPin size={12} aria-hidden="true" />{s.city} · {s.category_name}</p>
                  </div>
                  <div className="row" style={{ gap: 8 }}>
                    <Button size="sm" variant="secondary" icon={<Pencil size={14} />} onClick={() => setEditing(s)}>Edit</Button>
                    <Button size="sm" variant="danger-outline" icon={<Trash2 size={14} />} onClick={() => remove(s)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
      <ServiceModal target={editing} onClose={() => setEditing(null)} onSaved={services.reload} />
    </>
  );
}

function ServiceModal({ target, onClose, onSaved }: { target: Service | "new" | null; onClose: () => void; onSaved: () => void }) {
  const { profile, provider } = useAuth();
  const toast = useToast();
  const categories = useResource(() => api.categories(), []);
  const isNew = target === "new";
  const existing = target && target !== "new" ? target : null;
  const [form, setForm] = useState({ category_id: "", city: "", name: "", description: "" });
  const [loadedFor, setLoadedFor] = useState<unknown>(null);
  const [errors, setErrors] = useState<Errors<"category_id" | "city" | "name" | "form">>({});
  const [busy, setBusy] = useState(false);
  const [requesting, setRequesting] = useState(false);

  // Reset the form each time the modal opens for a different target.
  if (target !== loadedFor) {
    setLoadedFor(target);
    setErrors({});
    setForm(existing
      ? { category_id: existing.category_id, city: existing.city, name: existing.name, description: existing.description ?? "" }
      : { category_id: "", city: provider?.city ?? profile?.city ?? "", name: "", description: "" });
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (isNew && !form.category_id) next.category_id = "Choose a category";
    if (isNew && !form.city.trim()) next.city = "Enter the town you work in";
    if (!form.name.trim()) next.name = "Enter a service name";
    setErrors(next);
    if (hasErrors(next)) return;
    setBusy(true);
    try {
      if (existing) await api.updateService(existing.service_id, { name: form.name.trim(), description: form.description.trim() });
      else await api.createService({ category_id: form.category_id, city: form.city.trim(), name: form.name.trim(), description: form.description.trim() });
      toast.success(existing ? "Service updated" : "Service added");
      onSaved(); onClose();
    } catch (error) {
      setErrors({ form: error instanceof ApiError ? error.message : "We couldn't save the service." });
    } finally { setBusy(false); }
  };

  return (
    <>
      <Modal open={!!target} title={existing ? "Edit service" : "Add a service"} onClose={onClose}>
        <form onSubmit={submit} noValidate>
          <div className="modal-body form stack">
            {errors.form && <Banner tone="danger">{errors.form}</Banner>}
            {isNew && (
              <>
                <SelectField label="Category" value={form.category_id} error={errors.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                  <option value="">Choose a category</option>
                  {(categories.data ?? []).map((c) => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
                </SelectField>
                <p className="small" style={{ marginTop: -8 }}>Missing a category? <button type="button" style={{ background: "none", border: 0, padding: 0, color: "var(--green-700)", fontWeight: 600, textDecoration: "underline" }} onClick={() => setRequesting(true)}>Request one</button></p>
                <TextField label="Town / city" value={form.city} error={errors.city} hint="Customers search by town." onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </>
            )}
            {existing && <p className="hint-box">Category ({existing.category_name}) and town ({existing.city}) can't be changed. Add a new service for another town or category.</p>}
            <TextField label="Service name" placeholder="e.g. Leaking pipe repair" value={form.name} error={errors.name} maxLength={120} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextAreaField label="Description" optional value={form.description} maxLength={1000} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="modal-foot"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" loading={busy}>{existing ? "Save changes" : "Add service"}</Button></div>
        </form>
      </Modal>
      <CategoryRequestModal open={requesting} onClose={() => setRequesting(false)} onDone={() => {}} />
    </>
  );
}
