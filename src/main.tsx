import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@fontsource-variable/inter";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/ui.css";
import "./styles/layout.css";
import "./styles/home.css";
import "./styles/auth.css";
import App from "./App";
import { AuthProvider } from "./auth/AuthContext";
import { OverlayProvider } from "./components/ui/Overlay";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <OverlayProvider>
          <App />
        </OverlayProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
