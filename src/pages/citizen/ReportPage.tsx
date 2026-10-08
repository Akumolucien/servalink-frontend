import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { api, ApiError, uploadImage } from "../../api";
import { useAuth } from "../../auth/AuthContext";
import { BackLink, ImagePicker } from "../../components/domain/Provider";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Banner, CardSkeleton, EmptyState, ErrorState, PageHeader } from "../../components/ui/Display";
import { SelectField, TextAreaField } from "../../components/ui/Field";
import { useToast } from "../../components/ui/Overlay";
import { useResource } from "../../lib/useResource";

export const REPORT_REASONS = [
  "The work wasn't completed", "Poor quality of work", "Unprofessional behavior",
  "Safety concern", "The provider didn't show up", "Something else",
];

export function ReportPage() {
  const { id = "" } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const booking = useResource(() => api.booking(id), [id]);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ reason?: string; description?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  if (booking.loading && !booking.data) return <CardSkeleton rows={2} />;
  if (booking.error) return <ErrorState error={booking.error} onRetry={booking.reload} />;
  const b = booking.data!;
  const back = `/app/bookings/${b.booking_id}`;

  if (b.citizen_id !== session?.sub || b.report_id) {
    return (
      <div className="card"><EmptyState icon={b.report_id ? <CheckCircle2 size={24} /> : <ShieldAlert size={24} />}
        title={b.report_id ? "You've already reported this booking" : "You can't report this booking"}
        action={<ButtonLink to={b.report_id ? "/app/reports" : back} variant="secondary">{b.report_id ? "View my reports" : "Back to booking"}</ButtonLink>}>
        {b.report_id ? "Each booking can be reported once. An administrator will review it." : "Only the customer who made the booking can report it."}
      </EmptyState></div>
    );
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (!reason) next.reason = "Choose a reason";
    if (!description.trim()) next.description = "Describe what happened";
    setErrors(next);
    if (next.reason || next.description) return;
    setBusy(true);
    try {
      const evidence_key = evidence ? await uploadImage(evidence, "REPORT_EVIDENCE") : undefined;
      await api.createReport({ booking_id: b.booking_id, reason, description: description.trim(), evidence_key });
      toast.success("Report submitted");
      navigate("/app/reports", { replace: true });
    } catch (error) {
      setErrors({ form: error instanceof ApiError ? error.message : "We couldn't submit your report. Try again." });
      setBusy(false);
    }
  };

  return (
    <>
      <BackLink to={back}>Back to booking</BackLink>
      <PageHeader title="Report a problem" subtitle={`Booking ${b.reference} with ${b.provider_name}. Reporting doesn't change the booking status.`} />
      <form className="card card-pad stack" style={{ maxWidth: 680 }} onSubmit={submit} noValidate aria-label="Report">
        {errors.form && <Banner tone="danger">{errors.form}</Banner>}
        <SelectField label="What went wrong?" value={reason} error={errors.reason} onChange={(e) => { setReason(e.target.value); setErrors((er) => ({ ...er, reason: undefined })); }}>
          <option value="">Choose a reason</option>
          {REPORT_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </SelectField>
        <TextAreaField label="Describe what happened" value={description} error={errors.description} maxLength={2000}
          hint="Include dates and details. An administrator will review your report." onChange={(e) => { setDescription(e.target.value); setErrors((er) => ({ ...er, description: undefined })); }} />
        <ImagePicker label="Add evidence" file={evidence} onChange={setEvidence} hint="A photo that shows the problem. JPEG, PNG or WEBP, up to 10 MB." />
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <ButtonLink variant="ghost" to={back}>Cancel</ButtonLink>
          <Button type="submit" loading={busy}>Submit report</Button>
        </div>
      </form>
    </>
  );
}
