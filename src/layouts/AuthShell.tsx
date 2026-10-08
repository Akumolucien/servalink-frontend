import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { Brand, LocalModeBanner } from "../components/domain/Brand";

export function AuthShell({ children }: { children?: ReactNode }) {
  return (
    <>
      <LocalModeBanner />
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="public-nav"><div className="inner"><Brand /></div></header>
      <main id="main" className="auth-wrap" tabIndex={-1}>{children ?? <Outlet />}</main>
    </>
  );
}
