import { MOCK_PROVIDERS } from "../data/mockProviders";
import type { Provider } from "../types";

export type ProviderListResult = { providers: Provider[]; source: "api" | "mock" };

/** MOCKED: no featured-providers endpoint exists yet. Swap this body for an apiRequest call later. */
export async function listFeaturedProviders(): Promise<ProviderListResult> {
  return { providers: MOCK_PROVIDERS, source: "mock" };
}
