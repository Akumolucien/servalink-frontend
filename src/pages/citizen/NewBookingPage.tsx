import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MapPin, UserX } from "lucide-react";
import { api, ApiError } from "../../api";
import { useAuth } from "../../auth/AuthContext";
import { BackLink } from "../../components/domain/Provider";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Avatar, Banner, CardSkeleton, EmptyState, ErrorState, PageHeader, RatingChip } from "../../components/ui/Display";
import { TextAreaField, TextField } from "../../components/ui/Field";
import { useToast } from "../../components/ui/Overlay";
import { nextHourLocal } from "../../lib/format";
import { useResource } from "../../lib/useResource";

export function NewBookingPage() {
  const { serviceId = "" } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const service = useResource(() => api.service(serviceId), [serviceId]);
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ date?: string; message?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  if (service.loading && !service.data) return <CardSkeleton rows={2} />;
  if (service.error) {
    const missing = service.error instanceof ApiError && service.error.status === 404;
    return missing ? (
      <div className="card"><EmptyState icon={<UserX size={24} />} title="This service isn't available"
        action={<ButtonLink to="/search" variant="secondary">Find another service</ButtonLink>}>
        It may have been removed, or the provider is no longer active.
      </EmptyState></div>
    ) : <ErrorState error={service.error} onRetry={service.reload} />;
  }
  const s = service.data!;
  const own = s.provider_id === session?.sub;
  const min = nextHourLocal();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (!date) next.date = "Choose a date and time";
    else if (date < min) next.date = "Choose a time from the next hour onward";
    if (message.trim().length < 10) next.message = "Describe the job in a few words (at least 10 characters)";
    setErrors(next);
    if (next.date || next.message) return;
    setBusy(true);
    try {
      const booking = await api.createBooking({ service_id: s.service_id, booking_date: date, message: message.trim() });
      toast.success("Booking request sent");
      navigate(`/app/bookings/${booking.booking_id}`, { replace: true });
    } catch (error) {
      setErrors({ form: error instanceof ApiError ? error.message : "We couldn't send your request. Try again." });
      setBusy(false);
    }
  };

  return (
    <>
      <BackLink to={`/providers/${s.provider_id}`}>Back to provider</BackLink>
      <PageHeader title="Request a booking" subtitle="The provider will accept or decline your request." />
      <div className="two-col">
        <form className="card card-pad stack" onSubmit={submit} noValidate aria-label="Booking request">
          {own && <Banner tone="warning">This is your own service. You can't book yourself.</Banner>}
          {errors.form && <Banner tone="danger">{errors.form}</Banner>}
          <TextField label="Date and time" type="datetime-local" min={min} value={date} error={errors.date}
            hint="Choose when you'd like the provider to come." onChange={(e) => { setDate(e.target.value); setErrors((er) => ({ ...er, date: undefined })); }} disabled={own} />
          <TextAreaField label="Describe the job" value={message} error={errors.message} maxLength={1000}
            placeholder="For example: the kitchen pipe under the sink is leaking."
            onChange={(e) => { setMessage(e.target.value); setErrors((er) => ({ ...er, message: undefined })); }} disabled={own} />
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <ButtonLink variant="ghost" to={`/providers/${s.provider_id}`}>Cancel</ButtonLink>
            <Button type="submit" loading={busy} disabled={own}>Send booking request</Button>
          </div>
        </form>
        <aside className="card card-pad stack-sm" aria-label="Service summary">
          <h3 style={{ fontSize: "1rem" }}>{s.name}</h3>
          {s.description && <p className="muted small">{s.description}</p>}
          <p className="muted small row" style={{ gap: 4 }}><MapPin size={14} aria-hidden="true" />{s.city} · {s.category_name}</p>
          <hr className="divider" />
          <div className="row" style={{ gap: 12, flexWrap: "nowrap" }}>
            <Avatar name={s.provider_name} src={s.provider_photo_url} size={44} />
            <div><div style={{ fontWeight: 600 }}>{s.provider_name}</div><RatingChip rating={s.overall_rating} /></div>
          </div>
          <p className="hint-box">ServaLink doesn't handle payment. Agree on the details with your provider.</p>
        </aside>
      </div>
    </>
  );
}
