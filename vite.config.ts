import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Dev-only simulated auth (VITE_AUTH_MODE=local) belongs to `vite --mode integration`
// against the local harness. Refuse to build it into any deployable bundle.
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  if (command === "build" && (mode === "integration" || env.VITE_AUTH_MODE === "local")) {
    throw new Error("Local integration auth must never be built. Remove VITE_AUTH_MODE=local / --mode integration.");
  }
  return {
    plugins: [react()],
    test: { environment: "node", include: ["src/**/*.test.ts"] },
  };
});
