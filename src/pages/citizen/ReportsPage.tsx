import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Flag } from "lucide-react";
import { api } from "../../api";
import { Button } from "../../components/ui/Button";
import { Banner, CardSkeleton, EmptyState, ErrorState, PageHeader, StatusBadge } from "../../components/ui/Display";
import { SelectField } from "../../components/ui/Field";
import { Modal } from "../../components/ui/Overlay";
import { formatDateTime } from "../../lib/format";
import { focusDomId, useFocusTarget } from "../../lib/useFocusTarget";
import { REPORT_STATUS } from "../../lib/status";
import { useResource } from "../../lib/useResource";

export function ReportsPage() {
  const navigate = useNavigate();
  const reports = useResource(() => api.myReports(), []);
  const bookings = useResource(() => api.bookings("citizen"), []);
  const [picking, setPicking] = useState(false);
  const [bookingId, setBookingId] = useState("");

  // Deep link (notification): /app/reports/:id highlights that report.
  const { id } = useParams();
  const found = !!id && !!reports.data?.some((r) => r.report_id === id);
  const missing = !!id && !!reports.data && !found;
  useFocusTarget(id, found);
  const byId = new Map((bookings.data ?? []).map((b) => [b.booking_id, b]));
  const reportable = (bookings.data ?? []).filter((b) => !b.report_id);

  return (
    <>
      <PageHeader title="My reports" subtitle="Problems you've reported to ServaLink administrators."
        actions={<Button variant="secondary" onClick={() => setPicking(true)} disabled={reportable.length === 0}>Report a problem</Button>} />
      {missing && (
        <div style={{ marginBottom: 16 }}>
          <Banner tone="warning" action={<Link className="small nowrap" to="/app/reports">View my reports</Link>}>
            <strong>We couldn't find that report.</strong>
            <span>It may not exist, or it isn't one of your reports.</span>
          </Banner>
        </div>
      )}
      {reports.loading && !reports.data ? <CardSkeleton rows={2} />
        : reports.error ? <ErrorState error={reports.error} onRetry={reports.reload} title="We couldn't load your reports" />
          : reports.data!.length === 0 ? (
            <div className="card"><EmptyState icon={<Flag size={24} />} title="No reports">
              If a job goes wrong, open the booking and choose "Report a problem". Reports you submit will show up here with their status.
            </EmptyState></div>
          ) : (
            <div className="stack">
              {reports.data!.map((report) => {
                const booking = byId.get(report.booking_id);
                const status = REPORT_STATUS[report.status];
                return (
                  <article id={focusDomId(report.report_id)} className={`card card-pad stack-sm${report.report_id === id ? " focus-target" : ""}`} key={report.report_id}>
                    <div className="row-between">
                      <div>
                        <strong>{report.reason}</strong>
                        <div className="muted xs">{booking ? <><Link to={`/app/bookings/${booking.booking_id}`}>{booking.reference}</Link> · </> : ""}{formatDateTime(report.created_at)}</div>
                      </div>
                      <StatusBadge label={status.label} tone={status.tone} />
                    </div>
                    <p className="small">{report.description}</p>
                    {report.evidence_url && <a href={report.evidence_url} target="_blank" rel="noreferrer" className="small">View evidence photo</a>}
                    {report.admin_note && <p className="hint-box"><strong>Administrator note:</strong> {report.admin_note}</p>}
                  </article>
                );
              })}
            </div>
          )}

      <Modal open={picking} title="Report a problem" onClose={() => setPicking(false)}
        footer={<>
          <Button variant="ghost" onClick={() => setPicking(false)}>Cancel</Button>
          <Button disabled={!bookingId} onClick={() => navigate(`/app/bookings/${bookingId}/report`)}>Continue</Button>
        </>}>
        <div className="modal-body form">
          <SelectField label="Which booking is this about?" value={bookingId} onChange={(e) => setBookingId(e.target.value)}>
            <option value="">Choose a booking</option>
            {reportable.map((b) => <option key={b.booking_id} value={b.booking_id}>{b.reference} · {b.provider_name}</option>)}
          </SelectField>
        </div>
      </Modal>
    </>
  );
}
