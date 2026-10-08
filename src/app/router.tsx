import { createBrowserRouter, Navigate, useParams } from "react-router-dom";
import { PublicLayout } from "../layouts/PublicLayout";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { AdminLayout } from "../layouts/AdminLayout";
import { AuthenticatedRoute, ProviderRoute, AdminRoute } from "../auth/guards";
import { NotFoundPage, UnauthorizedPage } from "../pages/system/SystemPages";
import { HelpPage, PrivacyPage, TermsPage } from "../pages/system/LegalPages";

// Notification emails/push deep-link to /bookings/:id (backend), which lives at /account/bookings/:id here.
function BookingRedirect() { const { bookingId } = useParams(); return <Navigate to={`/account/bookings/${bookingId}`} replace />; }
import { HomePage } from "../pages/public/HomePage";
import { ServicesPage } from "../pages/public/ServicesPage";
import { ProviderProfilePage } from "../pages/public/ProviderProfilePage";
import { BecomeProviderPage } from "../pages/public/BecomeProviderPage";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { ForgotPasswordPage } from "../pages/auth/ForgotPasswordPage";
import { CitizenDashboardPage } from "../pages/citizen/CitizenDashboardPage";
import { NewBookingPage } from "../pages/citizen/NewBookingPage";
import { ReviewPage } from "../pages/citizen/ReviewPage";
import { BookingsPage } from "../pages/citizen/BookingsPage";
import { BookingDetailsPage } from "../pages/citizen/BookingDetailsPage";
import { ReviewsReportsPage } from "../pages/citizen/ReviewsReportsPage";
import { ProfilePage } from "../pages/citizen/ProfilePage";
import { ProviderDashboardPage } from "../pages/provider/ProviderDashboardPage";
import { ProviderBookingsPage } from "../pages/provider/ProviderBookingsPage";
import { ProviderProfileManagerPage } from "../pages/provider/ProviderProfileManagerPage";
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage";
import { ProviderManagementPage } from "../pages/admin/ProviderManagementPage";
import { ReportManagementPage } from "../pages/admin/ReportManagementPage";
import { ServiceManagementPage } from "../pages/admin/ServiceManagementPage";

// Old URLs from earlier iterations → new structure (avoids broken bookmarks/links).
const redirects: [string, string][] = [
  ["/register", "/signup"], ["/dashboard", "/account"], ["/bookings", "/account/bookings"], ["/profile", "/account/profile"],
  ["/reviews-reports", "/account/reviews-reports"], ["/provider/dashboard", "/provider"], ["/provider/apply", "/become-provider"], ["/admin/services", "/admin/categories"],
];

export const router = createBrowserRouter([
  { element: <PublicLayout />, children: [
    { path: "/", element: <HomePage /> },
    { path: "/services", element: <ServicesPage /> },
    { path: "/providers/:providerId", element: <ProviderProfilePage /> },
    { path: "/become-provider", element: <BecomeProviderPage /> },
    { path: "/login", element: <LoginPage /> },
    { path: "/signup", element: <RegisterPage /> },
    { path: "/forgot-password", element: <ForgotPasswordPage /> },
    { path: "/unauthorized", element: <UnauthorizedPage /> },
    { path: "/help", element: <HelpPage /> },
    { path: "/privacy", element: <PrivacyPage /> },
    { path: "/terms", element: <TermsPage /> },
    { path: "/bookings/:bookingId", element: <BookingRedirect /> },
  ] },
  ...redirects.map(([from, to]) => ({ path: from, element: <Navigate to={to} replace /> })),
  { element: <AuthenticatedRoute />, children: [
    { element: <DashboardLayout />, children: [
      { path: "/account", element: <CitizenDashboardPage /> },
      { path: "/account/bookings", element: <BookingsPage /> },
      { path: "/account/bookings/new", element: <NewBookingPage /> },
      { path: "/account/bookings/:bookingId", element: <BookingDetailsPage /> },
      { path: "/account/reviews/new", element: <ReviewPage /> },
      { path: "/account/reviews-reports", element: <ReviewsReportsPage /> },
      { path: "/account/profile", element: <ProfilePage /> },
      { element: <ProviderRoute />, children: [
        { path: "/provider", element: <ProviderDashboardPage /> },
        { path: "/provider/bookings", element: <ProviderBookingsPage /> },
        { path: "/provider/bookings/:bookingId", element: <BookingDetailsPage /> },
        { path: "/provider/profile", element: <ProviderProfileManagerPage /> },
      ] },
    ] },
  ] },
  { element: <AdminRoute />, children: [
    { element: <AdminLayout />, children: [
      { path: "/admin", element: <AdminDashboardPage /> },
      { path: "/admin/providers", element: <ProviderManagementPage /> },
      { path: "/admin/reports", element: <ReportManagementPage /> },
      { path: "/admin/categories", element: <ServiceManagementPage /> },
    ] },
  ] },
  { path: "*", element: <NotFoundPage /> },
]);
