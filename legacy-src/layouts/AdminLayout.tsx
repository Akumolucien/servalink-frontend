import { Shell } from "./Shell";

export function AdminLayout() {
  return <Shell title="SERVAlink Admin" groups={[{ label: "ADMINISTRATION", links: [
    { to: "/admin", label: "Dashboard", end: true },
    { to: "/admin/providers", label: "Providers" },
    { to: "/admin/reports", label: "Reports" },
    { to: "/admin/categories", label: "Service Categories" },
  ] }]} />;
}
