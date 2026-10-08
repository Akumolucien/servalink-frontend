# legacy-src

The frontend as it existed before the 2026-10-07 rebuild. Not part of the build (outside tsconfig `include`).
The same original project is also the first commit in this repository's Git history ("Import original phase-2 frontend").

- Everything here except `_overwritten-originals/` was moved out of `src/` unchanged.
- `_overwritten-originals/` holds the eight original files the rebuild replaced in place (`src/auth/AuthContext.tsx`,
  `src/vite-env.d.ts`, `src/styles/tokens.css`, and the root `package.json`, `vite.config.ts`, `index.html`,
  `tsconfig.json`, `README.md`). They were recovered byte-for-byte from the original copy in `Downloads`.

Safe to delete once the rebuild is accepted (history keeps it).
