# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Repository Layout

This is a monorepo with two independent apps:

```
/
├── frontend/     # React + Vite + TypeScript SPA
└── Backend/      # Node.js + Express REST API (mock data + Supabase)
```

**Never commit directly to `main`. Branch off `dev` and open PRs only.**

---

## Commands

### Frontend (`cd frontend`)

```bash
pnpm dev          # start Vite dev server → http://localhost:5173
pnpm build        # production build
```

No test runner is currently configured.

### Backend (`cd Backend`)

```bash
node src/server.js        # start → http://localhost:3000
npm run dev               # start with nodemon (auto-reload)
```

Both servers must be running simultaneously for full functionality.

---

## Architecture

### Frontend

- **Entry**: `frontend/src/main.tsx` → `frontend/src/app/App.tsx`
- **Router**: `frontend/src/app/routes.ts` — flat `createBrowserRouter` list; all screens are in `frontend/src/app/screens/`
- **UI primitives**: `frontend/src/app/components/ui/` — shadcn/ui components (Radix UI + Tailwind). Do not modify these files; extend by composing them.
- **Shared types**: `frontend/src/app/services/types.ts` — single source of truth for all domain types (`User`, `Post`, `Neighborhood`, etc.)
- **Service layer**: `frontend/src/app/services/storage.ts` — all API calls go through named service objects (`postsService`, `neighborhoodsService`, etc.). Screens must not call `fetch` directly.
- **Supabase client** (frontend): `frontend/src/app/services/supabaseClient.ts` — reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `.env.local`.
- **Path alias**: `@` resolves to `frontend/src/`
- **Figma assets**: use the `figma:asset/<filename>` scheme (resolved by the custom Vite plugin in `vite.config.ts`).

### Backend

- **Entry**: `Backend/src/server.js` → `Backend/src/app.js`
- **Route registration order matters**: Supabase routes (`supabaseNeighborhoodsRoutes`, `supabaseProposalsRoutes`) are mounted **before** mock data routes. Neighborhoods and proposals hit Supabase; everything else (posts, events, marketplace, messages, alerts, analytics, users, services) is served from in-memory mock data in `Backend/src/mockData.js`.
- **Supabase client** (backend): `Backend/src/supabaseClient.js` — reads `SUPABASE_URL` and `SUPABASE_ANON_KEY` from `Backend/.env`.
- **snake_case ↔ camelCase**: the backend transforms Supabase snake_case columns to camelCase before returning JSON. Frontend types use camelCase throughout.

### Data flow

```
Screen → service function (storage.ts) → fetch → Backend (port 3000)
                                                     ├── Supabase (neighborhoods, proposals)
                                                     └── mockData.js (everything else)
```

The service layer has local-storage fallbacks for most Supabase-backed operations; new features should follow the same try/catch + fallback pattern.

### Supabase tables

Key tables: `neighborhoods`, `neighborhood_settings`, `neighborhood_members`, `neighborhood_proposals`. Settings are stored in a separate `neighborhood_settings` table and joined at query time.

---

## Conventions

- All screens live in `frontend/src/app/screens/` — one file per route.
- New domain types go in `frontend/src/app/services/types.ts`.
- New API endpoints go in `Backend/src/routes/` as a new route file, then register in `Backend/src/app.js`.
- Tailwind v4 is used — utility classes only, no inline `style` props.
- TypeScript strict mode is implied; never use `any`.
- `@` alias for `frontend/src/` is available in all frontend files.
