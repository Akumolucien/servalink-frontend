import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell } from "lucide-react";
import { api, type Booking } from "../../api";
import { useAuth } from "../../auth/AuthContext";
import { usePopover } from "./usePopover";

interface Item { key: string; to: string; title: string; detail: string }

/**
 * The bell lists only real work waiting on the user, derived from their bookings
 * (there is no notifications endpoint): confirmations, reviews to leave, new requests.
 */
export function AttentionMenu() {
  const { hasProviderTools, needsSessionRefresh } = useAuth();
  const location = useLocation();
  const [items, setItems] = useState<Item[]>([]);
  const lastLoad = useRef(0);
  const { open, setOpen, anchor } = usePopover();

  useEffect(() => {
    if (Date.now() - lastLoad.current < 15_000) return;
    lastLoad.current = Date.now();
    let cancelled = false;
    (async () => {
      try {
        const citizen: Booking[] = await api.bookings("citizen");
        const provider: Booking[] = hasProviderTools ? await api.bookings("provider") : [];
        if (cancelled) return;
        const next: Item[] = [];
        for (const b of provider.filter((b) => b.status === "PENDING")) {
          next.push({ key: "p" + b.booking_id, to: `/app/bookings/${b.booking_id}`, title: "New booking request", detail: `${b.citizen_name || "A customer"} · ${b.reference}` });
        }
        for (const b of citizen.filter((b) => b.status === "AWAITING_CONFIRMATION")) {
          next.push({ key: "c" + b.booking_id, to: `/app/bookings/${b.booking_id}`, title: "Confirm the work is finished", detail: `${b.provider_name} · ${b.reference}` });
        }
        for (const b of citizen.filter((b) => b.status === "COMPLETED" && !b.reviewed)) {
          next.push({ key: "r" + b.booking_id, to: `/app/bookings/${b.booking_id}/review`, title: "Leave a review", detail: `${b.provider_name} · ${b.reference}` });
        }
        setItems(next);
      } catch { /* the bell is best-effort */ }
    })();
    return () => { cancelled = true; };
  }, [location.pathname, hasProviderTools]);

  const count = items.length + (needsSessionRefresh ? 1 : 0);
  return (
    <div className="pop-anchor" ref={anchor}>
      <button className="icon-btn" aria-label={count ? `Needs your attention (${count})` : "Nothing needs your attention"}
        aria-expanded={open} aria-haspopup="true" onClick={() => setOpen(!open)}>
        <Bell size={20} />
        {count > 0 && <span className="dot-count">{count}</span>}
      </button>
      {open && (
        <div className="popover" role="region" aria-label="Needs your attention">
          <div className="head">Needs your attention</div>
          {needsSessionRefresh && (
            <Link className="item" to="/app/provider" onClick={() => setOpen(false)}>
              <strong>Your provider application was approved</strong>
              <span className="muted">Refresh your access to unlock Provider Tools</span>
            </Link>
          )}
          {items.map((item) => (
            <Link key={item.key} className="item" to={item.to} onClick={() => setOpen(false)}>
              <strong>{item.title}</strong><span className="muted">{item.detail}</span>
            </Link>
          ))}
          {count === 0 && <div className="item muted">You're all caught up.</div>}
        </div>
      )}
    </div>
  );
}
