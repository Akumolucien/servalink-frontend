import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Flag } from "lucide-react";
import { api, type AdminProvider, type Report } from "../../api";
import { NoteModal } from "../../components/domain/NoteModal";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Banner, CardSkeleton, EmptyState, ErrorState, PageHeader, StatusBadge } from "../../components/ui/Display";
import { useToast } from "../../components/ui/Overlay";
import { formatDateTime } from "../../lib/format";
import { focusDomId, useFocusTarget } from "../../lib/useFocusTarget";
import { SUSPEND } from "../../lib/providerDecisions";
import { PROVIDER_STATUS, REPORT_STATUS } from "../../lib/status";
import { useResource } from "../../lib/useResource";

type Action = "START_REVIEW" | "RESOLVE" | "DISMISS";
const COPY: Record<Action, { label: string; title: string; note: string; done: string; tone?: "danger" }> = {
  START_REVIEW: { label: "Start review", title: "Start reviewing this report?", note: "Internal note", done: "Report is under review" },
  RESOLVE: { label: "Resolve", title: "Resolve this report?", note: "Resolution note (shared with the customer)", done: "Report resolved" },
  DISMISS: { label: "Dismiss", title: "Dismiss this report?", note: "Reason for dismissing (shared with the customer)", done: "Report dismissed", tone: "danger" },
};

export function AdminReportsPage() {
  const toast = useToast();
  const reports = useResource(() => api.adminReports(), []);
  // Reports carry provider ids only; the providers list supplies names and current status.
  const providers = useResource(() => api.adminProviders(), []);
  const byId = new Map((providers.data ?? []).map((p) => [p.provider_id, p]));
  const names = new Map((providers.data ?? []).map((p) => [p.provider_id, p.name]));
  const [target, setTarget] = useState<{ report: Report; action: Action } | null>(null);
  const [suspending, setSuspending] = useState<AdminProvider | null>(null);

  // Deep link (notification e-mail): /admin/reports/:id highlights that report.
  const { id } = useParams();
  const navigate = useNavigate();
  const found = !!id && !!reports.data?.some((r) => r.report_id === id);
  const missing = !!id && !!reports.data && !found;
  useFocusTarget(id, found);

  return (
    <>
      <PageHeader title="Reports" subtitle="Open reports and reports under review. Reports never change a booking's status." />
      {missing && (
        <div style={{ marginBottom: 16 }}>
          <Banner tone="info" action={<Link className="small nowrap" to="/admin/reports">View open reports</Link>}>
            <strong>That report isn't open any more.</strong>
            <span>It was already resolved or dismissed, or it doesn't exist. Only open reports and reports under review are listed here.</span>
          </Banner>
        </div>
      )}
      {reports.loading && !reports.data ? <CardSkeleton rows={2} />
        : reports.error ? <ErrorState error={reports.error} onRetry={reports.reload} title="We couldn't load reports" />
          : reports.data!.length === 0 ? <div className="card"><EmptyState icon={<Flag size={24} />} title="No open reports">Reports submitted by customers appear here.</EmptyState></div>
            : (
              <div className="stack">
                {reports.data!.map((report) => {
                  const status = REPORT_STATUS[report.status];
                  const provider = byId.get(report.provider_id);
                  return (
                    <article id={focusDomId(report.report_id)} className={`card card-pad stack-sm${report.report_id === id ? " focus-target" : ""}`} key={report.report_id}>
                      <div className="row-between">
                        <div>
                          <strong>{report.reason}</strong>
                          <div className="muted xs">Booking {report.booking_id.slice(0, 8).toUpperCase()} · Provider {names.get(report.provider_id) ?? report.provider_id.slice(0, 8)} · {formatDateTime(report.created_at)}</div>
                        </div>
                        <StatusBadge label={status.label} tone={status.tone} />
                      </div>
                      <p className="small" style={{ whiteSpace: "pre-line" }}>{report.description}</p>
                      {report.evidence_url && <a className="small" href={report.evidence_url} target="_blank" rel="noreferrer">View evidence photo</a>}
                      {provider && (
                        <div className="row small">
                          <span className="muted">Provider status</span>
                          <StatusBadge label={PROVIDER_STATUS[provider.status].label} tone={PROVIDER_STATUS[provider.status].tone} />
                        </div>
                      )}
                      <div className="report-foot">
                      <div className="actions" aria-label="Provider actions" role="group">
                        <ButtonLink size="sm" variant="secondary" to={`/admin/providers/${report.provider_id}`}>View provider</ButtonLink>
                        {provider?.status === "APPROVED" && <Button size="sm" variant="danger-outline" onClick={() => setSuspending(provider)}>Suspend provider</Button>}
                      </div>
                      <div className="actions" aria-label="Report actions" role="group">
                        {report.status === "OPEN" && <Button size="sm" variant="secondary" onClick={() => setTarget({ report, action: "START_REVIEW" })}>Start review</Button>}
                        <Button size="sm" onClick={() => setTarget({ report, action: "RESOLVE" })}>Resolve</Button>
                        <Button size="sm" variant="danger-outline" onClick={() => setTarget({ report, action: "DISMISS" })}>Dismiss</Button>
                      </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
      <NoteModal open={!!target} title={target ? COPY[target.action].title : ""} label={target ? COPY[target.action].note : ""}
        confirmLabel={target ? COPY[target.action].label : ""} tone={target ? COPY[target.action].tone : undefined}
        onClose={() => setTarget(null)}
        onSubmit={async (note) => {
          await api.adminProcessReport(target!.report.report_id, target!.action, note);
          toast.success(COPY[target!.action].done);
          setTarget(null);
          if (id) navigate("/admin/reports", { replace: true });
          await reports.reload();
        }} />
      <NoteModal open={!!suspending} title={suspending ? `${SUSPEND.label} ${suspending.name}?` : ""} label={SUSPEND.noteLabel}
        confirmLabel={SUSPEND.label} tone={SUSPEND.tone}
        intro={<p className="muted small">The provider is hidden from search and can't take new bookings. Existing bookings are not cancelled or changed, but this provider won't be able to update them. The report stays as it is until you resolve or dismiss it.</p>}
        onClose={() => setSuspending(null)}
        onSubmit={async (reason) => {
          await api.adminSetProviderStatus(suspending!.provider_id, SUSPEND.status, reason);
          toast.success(SUSPEND.done);
          setSuspending(null);
          await Promise.all([providers.reload(), reports.reload()]);
        }} />
    </>
  );
}
