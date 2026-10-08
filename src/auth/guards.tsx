import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { LoadingState } from "../components/common/LoadingState";

/** Frontend guards only improve UX; the API enforces real permissions. */
function Gate({ allow }: { allow?: "isProvider" | "isAdmin" }) {
  const auth = useAuth();
  const loc = useLocation();
  if (auth.loading) return <LoadingState label="Checking your session…" />;
  if (!auth.user) return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search }} />;
  if (allow && !auth[allow]) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
}
export const AuthenticatedRoute = () => <Gate />;
export const ProviderRoute = () => <Gate allow="isProvider" />;
export const AdminRoute = () => <Gate allow="isAdmin" />;
