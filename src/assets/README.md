# Assets

## Homepage image

The homepage hero uses `auth-painter.webp` (see below), the same photograph as the authentication pages.
It is the single import in `src/pages/public/HomePage.tsx`; replace that file or the import to change it.
Provider photos on the homepage are not assets: they come from each provider's own gallery.

`hero-worker.jpg` was the earlier temporary homepage placeholder. Nothing imports it any more, so it can be deleted.

## Authentication image

`auth-painter.webp` (1448x1086, standalone photograph of a painter, supplied by the project owner) is the background of the
login / sign-up / recovery image panel and the homepage hero photograph (`components/auth/AuthVisual.tsx`, `background-size: cover`). The focal point is set
in `styles/auth.css` (`.auth-visual-img`, `background-position`). The design mockup was deliberately NOT used as an image source.
