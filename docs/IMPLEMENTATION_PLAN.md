# ServaLink frontend rebuild: implementation plan

Source of truth: `servalink-backend/PROJECT_CONTEXT.md` (target contract) and `BACKEND_STATE.md` (what the code does today).
The original `src/` was lost (only `dist/` and `tsconfig.tsbuildinfo` remain), so this is a ground-up rebuild.

## Constraints carried into every phase
- No payments, pricing, chat, SMS, GPS/maps, favorites, star ratings or fake platform statistics.
- Ratings are labels: BAD/GOOD/VERY_GOOD/EXCELLENT shown as Bad/Good/V.Good/Excellent.
- Booking status only changes through `PUT /bookings/{id}` followed by a refetch. The UI never advances status.
- "Mark Finished" sends `MARK_COMPLETED` and results in AWAITING_CONFIRMATION.
- Never invent timestamps the backend does not return (only `created_at` / `updated_at`).
- Production path: Amplify + Cognito + `VITE_API_BASE_URL`. No mock fallbacks. Empty/loading/error states instead.
- Dev-only simulated auth exists only in `--mode local` dev server runs, is tree-shaken from production builds, and shows a banner.
- Nothing is deployed to AWS.

## Architecture (`src/`)
- `styles/`: design tokens + plain CSS (no framework).
- `config/`: env parsing, `isLocalIntegration` guard.
- `api/`: typed client (raw ID token in `Authorization`), one module per backend area, `ApiError`.
- `auth/`: `AuthProvider` over an adapter interface; `amplifyAdapter` (default) and `devAdapter` (local only, dynamically imported); route guards.
- `lib/`: `useResource` data hook, status/rating labels, date formatting, image upload helper.
- `components/ui/`: Button, Field, Card, StatusBadge, RatingChip, Avatar, Skeleton, EmptyState, ErrorState, Modal/ConfirmDialog, Toast, StatCard, Tabs.
- `components/domain/`: BookingCard, BookingTimeline, ProviderCard, ReviewItem, ImageUpload, AttentionMenu.
- `layouts/`: PublicShell, WorkspaceShell (sidebar + topbar + mobile drawer), AdaptiveShell.
- `pages/`: public, auth, citizen, provider, admin.

## Phases
1. Shell/design system, routing, API client, auth/session.
2. Public home, search, provider profile (reviews + gallery).
3. Onboarding/profile, citizen dashboard, booking create/list/detail.
4. Provider application, provider tools (dashboard, requests, services, gallery, profile).
5. Reviews and reports.
6. Minimum admin: provider applications (needs `GET /admin/providers`), reports, category requests.
7. Responsive polish, integration tests, local end-to-end workflow.

## Backend (smallest changes only)
- Add read-only `GET /admin/providers?status=` to the admin Lambda, route in `ApiStack`, `USERS_TABLE_NAME` env + read grant for the admin Lambda, route-set test, handler tests. Recorded in `BACKEND_STATE.md`.
- `servalink-backend/local_dev/`: local harness (moto + API Gateway event simulator + seed fixtures + simulated auth). No production handler changes.

## Verification
- `pytest` (existing 61 tests + new admin tests + API-level workflow and negative-case tests).
- `tsc -b` and `vite build`.
- Headless Chrome E2E against the local harness at desktop and phone width, with screenshots reviewed against the mockup.
