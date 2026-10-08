import { useState } from "react";
import { Inbox } from "lucide-react";
import { api, type Booking } from "../../api";
import { BookingCard } from "../../components/domain/Booking";
import { CardSkeleton, EmptyState, ErrorState, PageHeader } from "../../components/ui/Display";
import { Tabs } from "../../components/ui/Tabs";
import { CLOSED_BOOKING } from "../../lib/status";
import { useResource } from "../../lib/useResource";

type Tab = "requests" | "active" | "awaiting" | "completed" | "closed";
const FILTERS: Record<Tab, (b: Booking) => boolean> = {
  requests: (b) => b.status === "PENDING",
  active: (b) => b.status === "ACCEPTED" || b.status === "IN_PROGRESS",
  awaiting: (b) => b.status === "AWAITING_CONFIRMATION",
  completed: (b) => b.status === "COMPLETED",
  closed: (b) => CLOSED_BOOKING.includes(b.status),
};
const EMPTY: Record<Tab, string> = {
  requests: "New booking requests from customers will appear here.",
  active: "Jobs you've accepted or started will appear here.",
  awaiting: "Jobs you marked finished are waiting here for the customer to confirm.",
  completed: "Jobs the customer confirmed will appear here.",
  closed: "Requests you rejected, or that customers cancelled, appear here.",
};

/** Provider view of bookings: requests customers sent to my provider profile. */
export function ProviderBookingsPage() {
  const [tab, setTab] = useState<Tab>("requests");
  const bookings = useResource(() => api.bookings("provider"), []);
  const all = bookings.data ?? [];
  const count = (t: Tab) => (bookings.data ? all.filter(FILTERS[t]).length : undefined);
  const shown = all.filter(FILTERS[tab]);

  return (
    <>
      <PageHeader title="Booking requests" subtitle="Requests customers sent to your provider profile." />
      <div className="stack">
        <Tabs label="Filter booking requests" value={tab} onChange={setTab} tabs={[
          { id: "requests", label: "New requests", count: count("requests") }, { id: "active", label: "Active", count: count("active") },
          { id: "awaiting", label: "Awaiting confirmation", count: count("awaiting") }, { id: "completed", label: "Completed", count: count("completed") },
          { id: "closed", label: "Closed", count: count("closed") },
        ]} />
        {bookings.loading && !bookings.data ? <CardSkeleton rows={3} />
          : bookings.error ? <ErrorState error={bookings.error} onRetry={bookings.reload} title="We couldn't load booking requests" />
            : shown.length === 0 ? <div className="card"><EmptyState icon={<Inbox size={24} />} title="Nothing here">{EMPTY[tab]}</EmptyState></div>
              : <div className="stack">{shown.map((b) => <BookingCard key={b.booking_id} booking={b} onChanged={bookings.reload} />)}</div>}
      </div>
    </>
  );
}
