import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CalendarX2, CheckCircle2 } from "lucide-react";
import { api, ApiError, uploadImage, type Rating } from "../../api";
import { useAuth } from "../../auth/AuthContext";
import { BackLink, ImagePicker } from "../../components/domain/Provider";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Banner, CardSkeleton, EmptyState, ErrorState, PageHeader } from "../../components/ui/Display";
import { TextAreaField } from "../../components/ui/Field";
import { useToast } from "../../components/ui/Overlay";
import { RATING_LABEL, RATING_ORDER } from "../../lib/status";
import { useResource } from "../../lib/useResource";

export function ReviewPage() {
  const { id = "" } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const booking = useResource(() => api.booking(id), [id]);
  const [rating, setRating] = useState<Rating | "">("");
  const [comment, setComment] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ rating?: string; comment?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  if (booking.loading && !booking.data) return <CardSkeleton rows={2} />;
  if (booking.error) return <ErrorState error={booking.error} onRetry={booking.reload} />;
  const b = booking.data!;
  const back = `/app/bookings/${b.booking_id}`;

  if (b.citizen_id !== session?.sub || b.status !== "COMPLETED" || b.reviewed) {
    const reviewed = b.reviewed;
    return (
      <div className="card"><EmptyState icon={reviewed ? <CheckCircle2 size={24} /> : <CalendarX2 size={24} />}
        title={reviewed ? "You've already reviewed this booking" : "You can't review this booking yet"}
        action={<ButtonLink to={back} variant="secondary">Back to booking</ButtonLink>}>
        {reviewed ? "Each booking can be reviewed once." : "You can leave a review after you confirm the work is complete."}
      </EmptyState></div>
    );
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (!rating) next.rating = "Choose a rating";
    if (!comment.trim()) next.comment = "Tell others how the job went";
    setErrors(next);
    if (next.rating || next.comment) return;
    setBusy(true);
    try {
      const photo_key = photo ? await uploadImage(photo, "REVIEW") : undefined;
      await api.createReview({ booking_id: b.booking_id, rating: rating as Rating, comment: comment.trim(), photo_key });
      toast.success("Review submitted");
      navigate(back, { replace: true });
    } catch (error) {
      setErrors({ form: error instanceof ApiError ? error.message : "We couldn't submit your review. Try again." });
      setBusy(false);
    }
  };

  return (
    <>
      <BackLink to={back}>Back to booking</BackLink>
      <PageHeader title={`Review ${b.provider_name}`} subtitle={`Booking ${b.reference}. Your review will be marked as a verified booking.`} />
      <form className="card card-pad stack" style={{ maxWidth: 680 }} onSubmit={submit} noValidate aria-label="Review">
        {errors.form && <Banner tone="danger">{errors.form}</Banner>}
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="field-label" style={{ marginBottom: 8 }}>How was the work?</legend>
          <div className="rating-picker" role="radiogroup" aria-label="Rating">
            {RATING_ORDER.map((value) => (
              <label className="rating-option" key={value}>
                <input type="radio" name="rating" value={value} checked={rating === value} onChange={() => { setRating(value); setErrors((e) => ({ ...e, rating: undefined })); }} />
                <span>{RATING_LABEL[value]}</span>
              </label>
            ))}
          </div>
          {errors.rating && <p className="field-error" role="alert" style={{ marginTop: 6 }}>{errors.rating}</p>}
        </fieldset>
        <TextAreaField label="Your review" value={comment} error={errors.comment} maxLength={1500}
          placeholder="Was the provider on time? Was the work done well?" onChange={(e) => { setComment(e.target.value); setErrors((er) => ({ ...er, comment: undefined })); }} />
        <ImagePicker label="Add a photo" file={photo} onChange={setPhoto} hint="A photo of the finished work helps others. JPEG, PNG or WEBP, up to 10 MB." />
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <ButtonLink variant="ghost" to={back}>Cancel</ButtonLink>
          <Button type="submit" loading={busy}>Submit review</Button>
        </div>
      </form>
    </>
  );
}
