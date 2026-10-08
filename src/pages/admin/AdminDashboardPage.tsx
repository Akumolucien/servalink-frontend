import { Link } from "react-router-dom";
import { Flag, Hourglass, ShieldAlert, Tags } from "lucide-react";
import { api } from "../../api";
import { Avatar, EmptyState, ErrorState, PageHeader, Skeleton, StatCard, StatusBadge } from "../../components/ui/Display";
import { ButtonLink } from "../../components/ui/Button";
import { formatDate } from "../../lib/format";
import { PROVIDER_STATUS } from "../../lib/status";
import { useResource } from "../../lib/useResource";

export function AdminDashboardPage() {
  const providers = useResource(() => api.adminProviders(), []);
  const reports = useResource(() => api.adminReports(), []);
  const requests = useResource(() => api.adminCategoryRequests(), []);
  const pending = (providers.data ?? []).filter((p) => p.status === "PENDING");
  const suspended = (providers.data ?? []).filter((p) => p.status === "SUSPENDED").length;
  const pendingRequests = (requests.data ?? []).filter((r) => r.status === "PENDING").length;
  const num = (loading: boolean, data: unknown, value: number) => (loading && !data ? <Skeleton width={36} height={30} /> : value);

  return (
    <div className="stack-lg">
      <PageHeader title="Admin dashboard" subtitle="Work waiting for an administrator." />
      <div className="stat-grid">
        <StatCard to="/admin/providers" label="Pending provider applications" tone="amber" icon={<Hourglass size={22} />} value={num(providers.loading, providers.data, pending.length)} />
        <StatCard to="/admin/providers" label="Suspended providers" tone="red" icon={<ShieldAlert size={22} />} value={num(providers.loading, providers.data, suspended)} />
        <StatCard to="/admin/reports" label="Open reports" tone="blue" icon={<Flag size={22} />} value={num(reports.loading, reports.data, reports.data?.length ?? 0)} />
        <StatCard to="/admin/categories" label="Pending category requests" tone="purple" icon={<Tags size={22} />} value={num(requests.loading, requests.data, pendingRequests)} />
      </div>
      <section className="card" aria-label="Recent provider applications">
        <div className="card-head"><h3>Provider applications</h3><Link className="small" to="/admin/providers">View all</Link></div>
        {providers.loading && !providers.data ? <div className="card-body"><Skeleton height={44} /></div>
          : providers.error ? <ErrorState error={providers.error} onRetry={providers.reload} />
            : pending.length === 0 ? <EmptyState icon={<Hourglass size={24} />} title="No pending applications">New applications appear here for review.</EmptyState>
              : (
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>Name</th><th>Category</th><th>Town</th><th>Submitted</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
                    <tbody>
                      {pending.slice(0, 6).map((p) => (
                        <tr key={p.provider_id}>
                          <td><div className="row" style={{ gap: 10, flexWrap: "nowrap" }}><Avatar name={p.name} size={32} /><span>{p.name}</span></div></td>
                          <td>{p.service_category}</td><td>{p.city}</td><td className="nowrap">{formatDate(p.created_at)}</td>
                          <td><StatusBadge label={PROVIDER_STATUS[p.status].label} tone={PROVIDER_STATUS[p.status].tone} /></td>
                          <td><ButtonLink size="sm" to="/admin/providers">Review</ButtonLink></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
      </section>
    </div>
  );
}
