# ServaLink Frontend — Revised
This revision fixes the reviewed UX: real search inputs, responsive navigation/layouts, About and How It Works on the Home page, a complete Provider application form, cleaner Provider profiles, and a booking form route.

Run:
1. Copy `.env.example` to `.env`
2. `npm install`
3. `npm run dev`

The approved hero photograph is still not bundled because the exact image asset was not supplied as a usable file. The hero copy is preserved and the placeholder can be swapped later.

## Current frontend rules
- Citizen bookings and Provider bookings are separate views of the same booking lifecycle.
- Booking cards render progress from booking status: PENDING, ACCEPTED, IN_PROGRESS, AWAITING_CONFIRMATION, COMPLETED, with REJECTED/CANCELLED terminal states.
- Provider Tools belong to the same account and should only be shown after Provider approval when real auth/role data is connected.
- Providers choose a predefined service category. If missing, they submit a category request for Admin approval; it is not searchable/selectable until approved.
- Review proof photos are optional.
- No payments, pricing, chat/messaging, star ratings, GPS/radius search, SMS, or automatic image moderation are in the current scope.
- Demo records in the UI are placeholders until the corresponding API endpoints are connected.
