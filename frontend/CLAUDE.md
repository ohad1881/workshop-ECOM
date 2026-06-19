# Frontend — GiftGraph

React 19 + Vite + MUI (Material UI) + TanStack Query + React Router + React Hook Form + Zod + Axios.
Talks to the Django backend described in the root `README.md` (API contract = README Appendix B).

## Directory map (`src/`)

The layout sorts code by **scope of use** — how widely a piece is shared decides where it lives.

```
main.jsx              App entry: imports global CSS, mounts the root <App/>.
App.jsx               Composition root: wraps the app in providers and declares every route.
theme.js              The single source of truth for design tokens (palette, typography, spacing).
index.css             Global reset only — component styling does not belong here.

base_components/       App-shell & routing pieces: structural parts used once, app-wide.
general_components/    Generic, reusable widgets shared by 2+ pages.
general_hooks/         Hooks shared across pages, not owned by any single one.
context/               React contexts, one folder per context (see the split-by-export rule below).
api/                   The data layer — the ONLY place HTTP happens (see below).
utils/                 Pure, dependency-free helpers (constants, formatters, …).

<page>/                One folder per route, sitting directly at src/ root (no pages/ wrapper).
                       A page owns its route component plus any code used only by that page.
```

The guiding distinction: **used once and structural → `base_components/`; used by many → `general_*`;
used by one page → that page's folder; touches the network → `api/`.**

## Conventions

- **Files start flat and earn their folders.** A component is a single `Name.jsx` until it
  gains companion files — a non-trivial hook, a `Name.module.css`, or sub-components used only
  by it. At that point it graduates to a `Name/` folder holding `Name.jsx` plus those companions.
  Don't create a folder for a thing that has nothing to keep it company.
- **Extract a hook to its own file only when it carries weight** — real logic, side effects,
  or reuse/testing value. Trivial UI state (toggles, open/close) stays inline in the component.
- **No `index.js` barrels.** Always import the file directly by its path.
- **Pages live at `src/` root, one folder per route.** A page folder holds the route component
  directly, with page-only subcomponents alongside it as flat files (graduating to folders by
  the same earn-it rule above).
- **MUI-first styling.** Style with the theme and the `sx` prop, drawing colors/spacing from
  the `theme.js` palette tokens rather than hardcoding values. Reach for a `Name.module.css`
  only in the rare case `sx` genuinely can't express what you need.
- **`api/` is the only place that does HTTP.** Components and hooks import named functions from
  it and never touch the HTTP client directly. Each function returns already-parsed response
  data, not the transport envelope. A shared client module owns the configured instance, the
  auth/refresh interceptors, and token helpers; per-domain files group the calls by resource.
- **Each context is split by export kind.** A lint rule (`react-refresh/only-export-components`)
  forbids a file from exporting both a component and non-components, so every context becomes a
  folder of three single-purpose files: the bare context object, the provider component, and the
  consumer hook. Follow this same three-file shape for any new context.

## Where to add new code

- **A new page/route** → a new folder under `src/`, wrapped in the shared layout, with its
  `<Route>` registered in `App.jsx` (gated by the protected-route wrapper if it needs login).
- **A component used by ONE page** → a flat file inside that page's folder.
- **A reusable widget used by 2+ pages** → `general_components/`.
- **An app-shell / structural / routing piece** → `base_components/`.
- **A hook** → inline if trivial; otherwise its own file, co-located with its sole consumer, or
  in `general_hooks/` when 2+ pages share it. (Context hooks are the exception — they live in `context/`.)
- **A new backend call** → a named function in the matching `api/` domain file (or a new domain
  file). Never reach for the HTTP client from a component.
- **Colors / fonts / spacing tokens** → `theme.js`.

## Commands

```
npm install      # first time
npm run dev      # dev server at http://localhost:5173
npm run build    # production build (also catches broken imports)
npm run lint
npm run lint:fix # auto-fix what ESLint can fix mechanically
```

Env: see `.env.example` for a list of env variables available
