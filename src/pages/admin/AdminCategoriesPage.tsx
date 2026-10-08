import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Tags } from "lucide-react";
import { api, ApiError, type CategoryRequest } from "../../api";
import { Button } from "../../components/ui/Button";
import { Banner, CardSkeleton, EmptyState, ErrorState, PageHeader, StatusBadge } from "../../components/ui/Display";
import { useConfirm, useToast } from "../../components/ui/Overlay";
import { Tabs } from "../../components/ui/Tabs";
import { formatDateTime } from "../../lib/format";
import { focusDomId, useFocusTarget } from "../../lib/useFocusTarget";
import { REQUEST_STATUS } from "../../lib/status";
import { useResource } from "../../lib/useResource";

export function AdminCategoriesPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const requests = useResource(() => api.adminCategoryRequests(), []);
  const providers = useResource(() => api.adminProviders(), []);
  const names = new Map((providers.data ?? []).map((p) => [p.provider_id, p.name]));
  const [tab, setTab] = useState<"pending" | "processed">("pending");
  const [busy, setBusy] = useState<string>();

  // Deep link (notification e-mail): /admin/categories/:id shows that request.
  const { id } = useParams();
  const navigate = useNavigate();
  const linked = id ? requests.data?.find((r) => r.request_id === id) : undefined;
  const linkedTab = linked ? (linked.status === "PENDING" ? "pending" : "processed") : undefined;
  const missing = !!id && !!requests.data && !linked;
  useEffect(() => { if (linkedTab) setTab(linkedTab); }, [linkedTab]);
  useFocusTarget(id, !!linked && tab === linkedTab);

  const all = requests.data ?? [];
  const shown = all.filter((r) => (tab === "pending" ? r.status === "PENDING" : r.status !== "PENDING"));

  const decide = async (request: CategoryRequest, action: "APPROVE" | "REJECT") => {
    const approve = action === "APPROVE";
    const ok = await confirm({
      title: approve ? `Approve "${request.proposed_name}"?` : `Reject "${request.proposed_name}"?`,
      message: approve ? "A new category is created and becomes available to providers and in search." : "The request is closed. The category won't be created.",
      confirmLabel: approve ? "Approve category" : "Reject request", tone: approve ? "primary" : "danger",
    });
    if (!ok) return;
    setBusy(request.request_id);
    try { await api.adminProcessCategoryRequest(request.request_id, action); toast.success(approve ? "Category approved" : "Request rejected"); }
    catch (error) { toast.error(error instanceof ApiError ? error.message : "That didn't work. Try again."); }
    setBusy(undefined);
    if (id) navigate("/admin/categories", { replace: true });
    await requests.reload();
  };

  return (
    <>
      <PageHeader title="Category requests" subtitle="Providers can't use a new category until you approve it." />
      {missing && (
        <div style={{ marginBottom: 16 }}>
          <Banner tone="warning" action={<Link className="small nowrap" to="/admin/categories">View all requests</Link>}>
            <strong>We couldn't find that category request.</strong>
            <span>The link may be out of date, or the request may have been removed.</span>
          </Banner>
        </div>
      )}
      <div className="stack">
        <Tabs label="Request status" value={tab} onChange={setTab} tabs={[
          { id: "pending", label: "Pending", count: requests.data ? all.filter((r) => r.status === "PENDING").length : undefined },
          { id: "processed", label: "Processed", count: requests.data ? all.filter((r) => r.status !== "PENDING").length : undefined },
        ]} />
        {requests.loading && !requests.data ? <CardSkeleton rows={2} />
          : requests.error ? <ErrorState error={requests.error} onRetry={requests.reload} title="We couldn't load requests" />
            : shown.length === 0 ? <div className="card"><EmptyState icon={<Tags size={24} />} title={tab === "pending" ? "No pending requests" : "Nothing processed yet"}>Category requests from providers appear here.</EmptyState></div>
              : (
                <div className="stack">
                  {shown.map((r) => (
                    <article id={focusDomId(r.request_id)} className={`card card-pad stack-sm${r.request_id === id ? " focus-target" : ""}`} key={r.request_id}>
                      <div className="row-between">
                        <div>
                          <strong>{r.proposed_name}</strong>
                          <div className="muted xs">Requested by {names.get(r.provider_id) ?? "a customer"} · {formatDateTime(r.created_at)}</div>
                        </div>
                        <StatusBadge label={REQUEST_STATUS[r.status].label} tone={REQUEST_STATUS[r.status].tone} />
                      </div>
                      <p className="small">{r.description}</p>
                      {r.status === "PENDING" && (
                        <div className="actions">
                          <Button size="sm" loading={busy === r.request_id} disabled={!!busy} onClick={() => decide(r, "APPROVE")}>Approve</Button>
                          <Button size="sm" variant="danger-outline" disabled={!!busy} onClick={() => decide(r, "REJECT")}>Reject</Button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
      </div>
    </>
  );
}
