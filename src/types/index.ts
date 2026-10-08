export type Role = "CITIZEN" | "PROVIDER" | "ADMIN";
export type BookingStatus = "PENDING" | "ACCEPTED" | "IN_PROGRESS" | "AWAITING_CONFIRMATION" | "COMPLETED" | "REJECTED" | "CANCELLED";
export type ReviewRating = "BAD" | "GOOD" | "V_GOOD" | "EXCELLENT";
export type ReportStatus = "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "DISMISSED";
export type ProviderStatus = "PENDING_APPROVAL" | "ACTIVE" | "REJECTED" | "SUSPENDED" | "BANNED";
export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface User { id: string; fullName: string; email: string; phone?: string; city?: string; profileImageUrl?: string; roles: Role[] }
export interface Category { id: string; name: string }
export interface CategoryRequest { id: string; providerName?: string; proposedName: string; description: string; status: RequestStatus; createdAt: string }
export interface Service { id: string; providerId: string; name: string; categoryId: string; description: string }
export interface GalleryItem { id: string; providerId: string; imageUrl: string; caption?: string; createdAt: string }
export interface Provider { id: string; userId: string; name: string; categoryId: string; categoryName: string; city: string; description: string; imageUrl?: string; status: ProviderStatus; verifiedReviewCount: number; badReviewCount: number; overallRating?: ReviewRating }
export interface ProviderApplication { id: string; applicant: string; phone: string; city: string; categoryId: string; serviceTitle: string; description: string; imageUrl?: string; status: ProviderStatus; submittedAt: string }
export interface Booking { id: string; reference: string; service: string; citizenId: string; citizenName: string; providerId: string; providerName: string; city: string; date: string; time: string; description: string; status: BookingStatus; createdAt: string; reviewed?: boolean }
export interface Review { id: string; bookingId: string; providerId: string; reviewerName: string; rating: ReviewRating; comment: string; photoUrl?: string; createdAt: string }
export interface Report { id: string; bookingId: string; providerId: string; providerName: string; reason: string; explanation: string; evidenceUrl?: string; status: ReportStatus; adminNotes?: string; createdAt: string }

/** UI uses V_GOOD / "V.Good"; the backend stores VERY_GOOD. Convert only at the service boundary. */
export const RATING_LABEL: Record<ReviewRating, string> = { BAD: "Bad", GOOD: "Good", V_GOOD: "V.Good", EXCELLENT: "Excellent" };
export const ratingToWire = (r: ReviewRating) => (r === "V_GOOD" ? "VERY_GOOD" : r);
export const ratingFromWire = (r: string): ReviewRating => (r === "VERY_GOOD" ? "V_GOOD" : (r as ReviewRating));
