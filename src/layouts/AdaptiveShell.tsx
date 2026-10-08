import { useAuth } from "../auth/AuthContext";
import { PublicShell } from "./PublicShell";
import { WorkspaceShell } from "./WorkspaceShell";

/**
 * Pages that exist both publicly and inside the app (search, provider profile).
 * Signed-in citizens get the sidebar workspace; visitors and admins see the public site.
 */
export function AdaptiveShell() {
  const { status, isAdmin, profile } = useAuth();
  if (status === "authenticated" && !isAdmin && profile) return <WorkspaceShell />;
  return <PublicShell contained />;
}
