import { Link } from "react-router-dom";
import { CalendarCheck, CheckCircle2, ClipboardList, Flag, MessageSquareText, Search } from "lucide-react";
import { api } from "../../api";
import { useAuth } from "../../auth/AuthContext";
import { ButtonLink } from "../../components/ui/Button";
import { Avatar, Banner, EmptyState, PageHeader, Skeleton, StatCard, StatusBadge } from "../../components/ui/Display";
import { firstName, formatDateTime, greeting } from "../../lib/format";
import { ACTIVE_BOOKING, BOOKING_STATUS, PROVIDER_STATUS } from "../../lib/status";
import { useResource } from "../../lib/useResource";

export function DashboardPage() {
  const { profile, provider, needsSessionRefresh, hasProviderTools } = useAuth();
  const bookings = useResource(() => api.bookings("citizen"), []);
  const reviews = useResource(() => api.myReviews(), []);
  const reports = useResource(() => api.myReports(), []);

  const list = bookings.data ?? [];
  const active = bookings.data ? list.filter((b) => ACTIVE_BOOKING.includes(b.status)).length : undefined;
  const completed = bookings.data ? list.filter((b) => b.status === "COMPLETED").length : undefined;
  const count = (value: number | undefined, loading: boolean) => (loading && value === undefined ? <Skeleton width={36} height={30} /> : value ?? 0);
  const waiting = list.filter((b) => b.status === "AWAITING_CONFIRMATION");
  const toReview = list.filter((b) => b.status === "COMPLETED" && !b.reviewed);

  return (
    <div className="stack-lg">
      <PageHeader title={`${greeting()}, ${firstName(profile?.full_name) || "there"}!`} subtitle="Find trusted service providers and manage your bookings." />

      {needsSessionRefresh && (
        <Banner tone="success" action={<ButtonLink to="/app/provider" size="sm">Unlock Provider Tools</ButtonLink>}>
          <strong>Your provider application was approved.</strong>
          <span>Refresh your access to start using Provider Tools.</span>
        </Banner>
      )}
      {provider?.status === "PENDING" && (
        <Banner tone="info" action={<ButtonLink to="/app/become-provider" size="sm" variant="secondary">View status</ButtonLink>}>
          <strong>Your provider application is pending approval.</strong>
          <span>An administrator is reviewing it. You can keep using ServaLink as a customer meanwhile.</span>
        </Banner>
      )}
      {provider && ["SUSPENDED", "BANNED", "REJECTED"].includes(provider.status) && (
        <Banner tone="warning" action={<ButtonLink to="/app/become-provider" size="sm" variant="secondary">View details</ButtonLink>}>
          <strong>Provider status: {PROVIDER_STATUS[provider.status].label}.</strong>
          <span>Provider Tools aren't available for this account right now.</span>
        </Banner>
      )}

      <div className="stat-grid">
        <StatCard to="/app/bookings" label="Active bookings" icon={<CalendarCheck size={22} />} value={count(active, bookings.loading)} />
        <StatCard to="/app/bookings" label="Completed" tone="green" icon={<CheckCircle2 size={22} />} value={count(completed, bookings.loading)} />
        <StatCard to="/app/reviews" label="Reviews" tone="amber" icon={<MessageSquareText size={22} />} value={count(reviews.data?.length, reviews.loading)} />
        <StatCard to="/app/reports" label="Reports" tone="red" icon={<Flag size={22} />} value={count(reports.data?.length, reports.loading)} />
      </div>

      <div className="two-col">
        <div className="stack-lg">
          {(waiting.length > 0 || toReview.length > 0) && (
            <section className="card" aria-label="Waiting on you">
              <div className="card-head"><h3>Waiting on you</h3></div>
              {waiting.map((b) => (
                <div className="service-row" key={b.booking_id}>
                  <div><strong>Confirm the work is finished</strong><p className="muted small">{b.provider_name} · {b.reference}</p></div>
                  <ButtonLink size="sm" to={`/app/bookings/${b.booking_id}`}>Review and confirm</ButtonLink>
                </div>
              ))}
              {toReview.map((b) => (
                <div className="service-row" key={b.booking_id}>
                  <div><strong>Leave a review</strong><p className="muted small">{b.provider_name} · {b.reference}</p></div>
                  <ButtonLink size="sm" variant="secondary" to={`/app/bookings/${b.booking_id}/review`}>Write review</ButtonLink>
                </div>
              ))}
            </section>
          )}
          <section className="card" aria-label="Your activity">
            <div className="card-head">
              <h3>Your activity</h3>
              {list.length > 0 && <Link className="small" to="/app/bookings">View all bookings</Link>}
            </div>
            {bookings.loading && !bookings.data ? (
              <div className="card-body stack-sm"><Skeleton height={44} /><Skeleton height={44} /></div>
            ) : list.length === 0 ? (
              <EmptyState icon={<ClipboardList size={24} />} title="Nothing here yet"
                action={<ButtonLink to="/search" icon={<Search size={16} />}>Find a service</ButtonLink>}>
                Your bookings, reviews and reports will appear here once you start using ServaLink.
              </EmptyState>
            ) : list.slice(0, 5).map((b) => (
              <Link key={b.booking_id} to={`/app/bookings/${b.booking_id}`} className="service-row" style={{ color: "inherit" }}>
                <span className="row" style={{ gap: 12, flexWrap: "nowrap" }}>
                  <Avatar name={b.provider_name} size={40} />
                  <span><strong>{b.provider_name}</strong><br /><span className="muted small">{b.category_name} · {formatDateTime(b.created_at)}</span></span>
                </span>
                <StatusBadge label={BOOKING_STATUS[b.status].label} tone={BOOKING_STATUS[b.status].tone} />
              </Link>
            ))}
          </section>
        </div>

        <aside className="stack">
          <div className="cta-card">
            <Search size={28} aria-hidden="true" />
            <h2 style={{ fontSize: "1.25rem" }}>Find a service</h2>
            <p>Search for trusted providers in your town.</p>
            <ButtonLink to="/search" variant="light" icon={<Search size={16} />}>Search services</ButtonLink>
          </div>
          {!provider && !hasProviderTools && (
            <div className="card card-pad stack-sm">
              <h3 style={{ fontSize: "1rem" }}>Offer your own services</h3>
              <p className="muted small">Apply with your existing account. No second login needed.</p>
              <ButtonLink to="/app/become-provider" variant="secondary" size="sm">Become a provider</ButtonLink>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
