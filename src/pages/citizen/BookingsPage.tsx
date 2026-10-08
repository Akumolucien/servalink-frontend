import { useState } from "react";
import { CalendarX2 } from "lucide-react";
import { api, type Booking } from "../../api";
import { BookingCard } from "../../components/domain/Booking";
import { ButtonLink } from "../../components/ui/Button";
import { CardSkeleton, EmptyState, ErrorState, PageHeader } from "../../components/ui/Display";
import { Tabs } from "../../components/ui/Tabs";
import { ACTIVE_BOOKING, CLOSED_BOOKING } from "../../lib/status";
import { useResource } from "../../lib/useResource";

type Tab = "all" | "active" | "completed" | "closed";
const FILTERS: Record<Tab, (b: Booking) => boolean> = {
  all: () => true,
  active: (b) => ACTIVE_BOOKING.includes(b.status),
  completed: (b) => b.status === "COMPLETED",
  closed: (b) => CLOSED_BOOKING.includes(b.status),
};

export function BookingsPage() {
  const [tab, setTab] = useState<Tab>("all");
  const bookings = useResource(() => api.bookings("citizen"), []);
  const all = bookings.data ?? [];
  const shown = all.filter(FILTERS[tab]);
  const count = (t: Tab) => (bookings.data ? all.filter(FILTERS[t]).length : undefined);

  return (
    <>
      <PageHeader title="My bookings" subtitle="Services you've requested from providers."
        actions={<ButtonLink to="/search">Find a service</ButtonLink>} />
      <div className="stack">
        <Tabs label="Filter bookings" value={tab} onChange={setTab} tabs={[
          { id: "all", label: "All", count: count("all") }, { id: "active", label: "Active", count: count("active") },
          { id: "completed", label: "Completed", count: count("completed") }, { id: "closed", label: "Cancelled or rejected", count: count("closed") },
        ]} />
        {bookings.loading && !bookings.data ? <CardSkeleton rows={3} />
          : bookings.error ? <ErrorState error={bookings.error} onRetry={bookings.reload} title="We couldn't load your bookings" />
            : shown.length === 0 ? (
              <div className="card">
                <EmptyState icon={<CalendarX2 size={24} />} title={all.length === 0 ? "No bookings yet" : "No bookings in this view"}
                  action={all.length === 0 ? <ButtonLink to="/search">Find a service</ButtonLink> : undefined}>
                  {all.length === 0 ? "When you book a provider, you can follow every step of the job here." : "Try another tab to see your other bookings."}
                </EmptyState>
              </div>
            ) : (
              <div className="stack">{shown.map((b) => <BookingCard key={b.booking_id} booking={b} onChanged={bookings.reload} />)}</div>
            )}
      </div>
    </>
  );
}
