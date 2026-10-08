import { House } from "lucide-react";
import { Link } from "react-router-dom";
import { isLocalIntegration } from "../../config/env";

export function Brand({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="brand" aria-label="ServaLink home">
      <House size={26} strokeWidth={2.2} aria-hidden="true" />
      ServaLink
    </Link>
  );
}

/** Visible only in `vite --mode integration`; never rendered in a production build. */
export function LocalModeBanner() {
  if (!isLocalIntegration) return null;
  return <div className="local-banner" role="note">LOCAL INTEGRATION MODE: simulated sign-in and a local API. This is not AWS.</div>;
}
