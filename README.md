# ServaLink frontend

React 19 + TypeScript + Vite + React Router + AWS Amplify (Cognito) + Lucide, with plain CSS design tokens.
Source of truth for behaviour: `../servalink-backend/PROJECT_CONTEXT.md` (target contract) and `BACKEND_STATE.md` (what the code does today).
This is a ground-up rebuild (2026-10-07). The previous source is archived untouched in `legacy-src/` (see its README); it is not part of the build.

## Run

Production-style (real Amplify + Cognito + the API in `.env`):

```powershell
copy .env.example .env      # then npm install
npm run dev
npm run build               # tsc -b && vite build
```

Local integration (no AWS; needs the backend harness running, see `../servalink-backend/local_dev/README.md`):

```powershell
# terminal 1 (in servalink-backend)
python -m local_dev.server --seed demo
# terminal 2
npm run dev:local -- --port 5273
```

Local mode (`vite --mode integration`, `.env.integration`) swaps Cognito for a simulated sign-in and shows a banner.
It is gated three ways: `import.meta.env.DEV`, `MODE === "integration"` and `VITE_AUTH_MODE === "local"`; the simulated adapter is
dynamically imported behind that check (absent from `dist/`, verified by grep), and `vite build` throws if either local flag is set.

## Tests

```powershell
npm test                      # vitest: timeline, labels, formatting
node e2e/workflow.mjs         # full browser workflow (Chrome via playwright-core), needs both servers; writes e2e/screenshots/
node e2e/a11y.mjs             # axe-core WCAG 2.1 A/AA scan of the main screens
node e2e/deeplinks.mjs        # opens the links the real notification Lambda produced, as the right and wrong people, desktop + phone
node e2e/responsive.mjs       # every screen, every role, 360/390/820/1024px: no horizontal page scroll
node e2e/tour.mjs             # screenshot tour of every main screen at desktop and phone width
```

## Structure (`src/`)

| Folder | Purpose |
|---|---|
| `api/` | Typed client for the contract (raw ID token in `Authorization`), `ApiError`, image upload helper |
| `auth/` | `AuthContext` (session, profile, provider record, token refresh), adapters (`amplifyAdapter`, dev-only `devAdapter`), route guards |
| `components/ui/` | Button, fields, Display (badges, rating chip, skeletons, empty/error states), Overlay (modal, confirm, toasts), Tabs |
| `components/domain/` | BookingCard, BookingTimeline, booking actions, ProviderCard, ReviewItem, ImagePicker, AttentionMenu |
| `layouts/` | PublicShell, WorkspaceShell (sidebar + mobile drawer), AdaptiveShell, AuthShell |
| `pages/` | public, auth, citizen, provider, admin |
| `lib/` | status/rating labels, timeline builder, formatting, `useResource` |
| `styles/` | `tokens.css` (palette/type), `base.css`, `ui.css`, `layout.css` |

## Notification deep links

E-mails, admin SNS mail and push notifications link to exact pages. The routes they target are: `/app/bookings/:id` (shared booking details, both sides), `/app/reports/:id`, `/app/provider`, `/app/become-provider`, `/admin/providers/:id`, `/admin/reports/:id`, `/admin/categories/:id`. The backend owns the event-to-route table (`servalink-backend/lambda/layers/deeplinks/python/servalink_deeplinks.py`) and its tests check every target against `src/App.tsx`, so **adding or renaming one of these routes means updating that table**. The destination is kept through login, registration, verification and onboarding via a same-site-only `?next=` (`src/lib/redirect.ts`). Record pages show a clear message when the record is missing or not yours.

## Product rules the UI enforces

- Ratings are labels (Bad / Good / V.Good / Excellent), never stars or numbers. No pricing, payment, chat, maps, favorites or invented statistics.
- Booking status only changes via `PUT /bookings/{id}` followed by a refetch. "Mark Finished" sends `MARK_COMPLETED` and ends in AWAITING_CONFIRMATION.
- The timeline is derived from `booking.status`; only `created_at` and `updated_at` are shown as times.
- Provider Tools need the PROVIDER group in the token AND an APPROVED provider record. After approval the app refreshes the token (automatically once, or via "Refresh access").
- Categories on the homepage, search and forms come from `GET /service-categories`; empty states are shown when there are none.

## Assets

`src/assets/hero-worker.jpg` is a TEMPORARY low-resolution placeholder cropped from the design mockup. Replace the file (or the single import in `HomePage.tsx`) with a high-resolution photograph; nothing depends on its dimensions.
