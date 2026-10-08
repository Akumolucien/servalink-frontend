import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { fetchAuthSession, signIn, signOut } from "aws-amplify/auth";
import type { Role } from "../types";

export type AuthUser = { id: string; email: string; roles: Role[] };
type AuthCtx = {
  user: AuthUser | null; loading: boolean; isProvider: boolean; isAdmin: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<AuthUser | null>;
};
const Ctx = createContext<AuthCtx | null>(null);

/** Roles come from Cognito groups. The backend remains the real security boundary. */
async function loadUser(force = false): Promise<AuthUser | null> {
  try {
    const session = await fetchAuthSession({ forceRefresh: force });
    const p = session.tokens?.idToken?.payload;
    if (!p) return null;
    const groups = (p["cognito:groups"] as string[] | undefined) ?? [];
    const roles: Role[] = groups.includes("ADMIN") ? ["ADMIN"] : groups.includes("PROVIDER") ? ["CITIZEN", "PROVIDER"] : ["CITIZEN"];
    return { id: String(p.sub), email: String(p.email ?? ""), roles };
  } catch {
    return null;
  }
}

const friendly = (e: unknown) => {
  const name = (e as Error)?.name;
  if (name === "NotAuthorizedException" || name === "UserNotFoundException") return "Incorrect email or password.";
  if (name === "UserNotConfirmedException") return "Please verify your email address before logging in.";
  return "We couldn't log you in. Please try again.";
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    loadUser().then((u) => { if (live) { setUser(u); setLoading(false); } });
    return () => { live = false; };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      await signIn({ username: email, password });
    } catch (e) {
      if ((e as Error).name !== "UserAlreadyAuthenticatedException") throw new Error(friendly(e));
    }
    const u = await loadUser();
    if (!u) throw new Error("Please verify your email address before logging in.");
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => { await signOut(); setUser(null); }, []);
  const refresh = useCallback(async () => { const u = await loadUser(true); setUser(u); return u; }, []);

  const value = useMemo<AuthCtx>(() => ({
    user, loading, login, logout, refresh,
    isProvider: !!user?.roles.includes("PROVIDER"), isAdmin: !!user?.roles.includes("ADMIN"),
  }), [user, loading, login, logout, refresh]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
