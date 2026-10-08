import type { Provider } from "../types";

/** DEMO DATA ONLY — not live AWS data. Replace via providerService when the endpoint is wired. */
export const MOCK_PROVIDERS: Provider[] = [
  { id: "samuel", userId: "mock-user-1", name: "Samuel N.", categoryId: "ELECTRICAL", categoryName: "Electrical", city: "Buea", description: "Sockets, wiring faults, lighting and general electrical repairs.", status: "ACTIVE", verifiedReviewCount: 18, badReviewCount: 2, overallRating: "V_GOOD" },
  { id: "grace", userId: "mock-user-2", name: "Grace T.", categoryId: "PLUMBING", categoryName: "Plumbing", city: "Douala", description: "Leaking pipes, sink installation and blocked drains.", status: "ACTIVE", verifiedReviewCount: 24, badReviewCount: 1, overallRating: "EXCELLENT" },
  { id: "daniel", userId: "mock-user-3", name: "Daniel M.", categoryId: "TUTORING", categoryName: "Tutoring", city: "Buea", description: "Maths and science tutoring for secondary school students.", status: "ACTIVE", verifiedReviewCount: 11, badReviewCount: 0, overallRating: "GOOD" },
];
