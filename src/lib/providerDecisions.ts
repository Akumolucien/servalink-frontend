import type { ProviderStatus } from "../api/types";

export type Decision = Exclude<ProviderStatus, "PENDING">;
export interface DecisionDef { status: Decision; label: string; variant: "primary" | "danger-outline" | "secondary"; tone?: "danger"; noteLabel: string; seed?: string; done: string }

const SUSPEND: DecisionDef = { status: "SUSPENDED", label: "Suspend", variant: "danger-outline", tone: "danger", noteLabel: "Reason for suspending", done: "Provider suspended" };
const BAN: DecisionDef = { status: "BANNED", label: "Ban", variant: "danger-outline", tone: "danger", noteLabel: "Reason for banning", done: "Provider banned" };

/** Admin decisions available for each provider status (shared by the Providers and Reports pages). */
export const DECISIONS: Record<ProviderStatus, DecisionDef[]> = {
  PENDING: [
    { status: "APPROVED", label: "Approve", variant: "primary", noteLabel: "Note for the provider", seed: "Verified and approved.", done: "Provider approved" },
    { status: "REJECTED", label: "Reject", variant: "danger-outline", tone: "danger", noteLabel: "Reason for rejecting", done: "Application rejected" },
  ],
  APPROVED: [SUSPEND, BAN],
  SUSPENDED: [
    { status: "APPROVED", label: "Reinstate", variant: "primary", noteLabel: "Note for the provider", seed: "Suspension lifted.", done: "Provider reinstated" },
    BAN,
  ],
  REJECTED: [], BANNED: [],
};

export { SUSPEND };
