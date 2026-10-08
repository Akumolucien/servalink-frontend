const AUTH_PATHS = ["/login", "/register", "/verify", "/forgot-password"];

/**
 * Where to go after login / registration / onboarding. Accepts only a path inside this app.
 * Rejects absolute and protocol-relative URLs ("//evil.test"), backslash tricks, control characters
 * and the auth pages themselves (which would loop), so a crafted ?next= can never leave the site.
 */
export function safeNext(value: string | null | undefined, fallback: string): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  if (/[\u0000-\u001f]/.test(value)) return fallback;
  try {
    const parsed = new URL(value, "http://app.invalid");
    if (parsed.origin !== "http://app.invalid") return fallback;
    if (AUTH_PATHS.some((path) => parsed.pathname === path || parsed.pathname.startsWith(path + "/"))) return fallback;
  } catch {
    return fallback;
  }
  return value;
}

/** Appends ?next= (already validated) to an auth-flow URL. */
export function withNext(path: string, next: string | null | undefined): string {
  const safe = safeNext(next, "");
  return safe ? `${path}${path.includes("?") ? "&" : "?"}next=${encodeURIComponent(safe)}` : path;
}
