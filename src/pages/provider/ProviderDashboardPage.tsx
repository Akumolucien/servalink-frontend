import { Link } from "react-router-dom";
import { Briefcase, CheckCheck, Inbox, Wrench } from "lucide-react";
import { api } from "../../api";
import { useAuth } from "../../auth/AuthContext";
import { Avatar, EmptyState, ErrorState, PageHeader, Skeleton, StatCard, StatusBadge } from "../../components/ui/Display";
import { ButtonLink } from "../../components/ui/Button";
import { firstName, formatBookingDate, greeting } from "../../lib/format";
import { BOOKING_STATUS } from "../../lib/status";
import { useResource } from "../../lib/useResource";

export function ProviderDashboardPage() {
  const { profile, provider, session } = useAuth();
  const bookings = useResource(() => api.bookings("provider"), []);
  const services = useResource(() => api.myServices(session!.sub), [session?.sub]);
  const list = bookings.data ?? [];
  const pending = list.filter((b) => b.status === "PENDING");
  const active = list.filter((b) => b.status === "ACCEPTED" || b.status === "IN_PROGRESS").length;
  const awaiting = list.filter((b) => b.status === "AWAITING_CONFIRMATION").length;
  const num = (value: number) => (bookings.loading && !bookings.data ? <Skeleton width={36} height={30} /> : value);

  return (
    <div className="stack-lg">
      <PageHeader title={`${greeting()}, ${firstName(profile?.full_name) || "there"}!`}
        subtitle={`Here's what's happening with ${provider?.service_title ?? "your work"}.`} />
      <div className="stat-grid">
        <StatCard to="/app/provider/bookings" label="New booking requests" icon={<Inbox size={22} />} tone="blue" value={num(pending.length)} />
        <StatCard to="/app/provider/bookings" label="Active jobs" icon={<Briefcase size={22} />} tone="green" value={num(active)} />
        <StatCard to="/app/provider/bookings" label="Awaiting confirmation" icon={<CheckCheck size={22} />} tone="purple" value={num(awaiting)} />
        <StatCard to="/app/provider/services" label="Listed services" icon={<Wrench size={22} />} tone="amber"
          value={services.loading && !services.data ? <Skeleton width={36} height={30} /> : services.data?.length ?? 0} />
      </div>

      {services.data && services.data.length === 0 && (
        <div className="card"><EmptyState icon={<Wrench size={24} />} title="Add your first service"
          action={<ButtonLink to="/app/provider/services">Add a service</ButtonLink>}>
          Customers can only book services you've listed. Add one to start appearing in search results.
        </EmptyState></div>
      )}

      <section className="card" aria-label="Recent booking requests">
        <div className="card-head"><h3>Recent booking requests</h3><Link className="small" to="/app/provider/bookings">View all</Link></div>
        {bookings.loading && !bookings.data ? <div className="card-body stack-sm"><Skeleton height={44} /><Skeleton height={44} /></div>
          : bookings.error ? <ErrorState error={bookings.error} onRetry={bookings.reload} />
            : list.length === 0 ? <EmptyState icon={<Inbox size={24} />} title="No requests yet">Booking requests from customers will appear here.</EmptyState>
              : list.slice(0, 5).map((b) => (
                <Link key={b.booking_id} to={`/app/bookings/${b.booking_id}`} className="service-row" style={{ color: "inherit" }}>
                  <span className="row" style={{ gap: 12, flexWrap: "nowrap" }}>
                    <Avatar name={b.citizen_name} size={40} />
                    <span><strong>{b.citizen_name}</strong><br /><span className="muted small">{b.category_name} · {formatBookingDate(b.booking_date)}</span></span>
                  </span>
                  <StatusBadge label={BOOKING_STATUS[b.status].label} tone={BOOKING_STATUS[b.status].tone} />
                </Link>
              ))}
      </section>
    </div>
  );
}
