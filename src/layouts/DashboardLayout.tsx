import { Shell, type NavGroup } from "./Shell";
import { useAuth } from "../auth/AuthContext";

/** One account: Citizen nav always; Provider Tools appear once the account has the PROVIDER group. */
export function DashboardLayout() {
  const { isProvider } = useAuth();
  const groups: NavGroup[] = [{
    label: "MY ACCOUNT",
    links: [
      { to: "/account", label: "Dashboard", end: true },
      { to: "/account/bookings", label: "My Bookings" },
      { to: "/account/reviews-reports", label: "My Reviews & Reports" },
      { to: "/account/profile", label: "My Profile" },
      ...(isProvider ? [] : [{ to: "/become-provider", label: "Become a Provider" }]),
    ],
  }];
  if (isProvider) groups.push({
    label: "PROVIDER TOOLS",
    links: [
      { to: "/provider", label: "Provider Dashboard", end: true },
      { to: "/provider/bookings", label: "Booking Requests" },
      { to: "/provider/profile", label: "Provider Profile" },
    ],
  });
  return <Shell groups={groups} title="SERVAlink" />;
}
