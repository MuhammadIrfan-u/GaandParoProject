# CLAUDE.md — Verified Neighbourhood Community Project

This file provides comprehensive context and guidance for AI assistants (Antigravity/Claude) working on this repository.

---

## 🚀 Repository Overview

This is a monorepo containing a full-stack community platform designed for verified neighborhood interactions.

### Architecture
```
/
├── frontend/     # React + Vite + TypeScript (SPA)
└── Backend/      # Node.js + Express (Hybrid: Supabase + Mock Data)
```

**Workflow Rule**: Never commit directly to `main`. Branch off `dev` and open PRs.

---

## 🛠 Commands

### Core Services
*   **Frontend**: `cd frontend && pnpm dev` (Vite, default port 5173)
*   **Backend**: `cd Backend && npm run dev` (Nodemon, default port 3000)
*   **Build**: `cd frontend && pnpm build`

### Environment
*   **Frontend**: Requires `frontend/.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
*   **Backend**: Requires `Backend/.env` with `SUPABASE_URL` and `SUPABASE_ANON_KEY`.

---

## 🏛 Technical Stack & Patterns

### Frontend (React + TS)
- **Styling**: Tailwind CSS v4 (Utility-first, no inline styles).
- **UI Components**: Shadcn/ui (Radix UI base). Location: `frontend/src/app/components/ui/`.
- **Animations**: Framer Motion (imported as `motion`).
- **Icons**: Lucide React.
- **Routing**: React Router v7 (`createBrowserRouter`). Map in `frontend/src/app/routes.ts`.
- **State & Data**:
    - **Service Layer**: All data fetching MUST go through `frontend/src/app/services/storage.ts`.
    - **Types**: Single source of truth in `frontend/src/app/services/types.ts`.
    - **Fallback Pattern**: Most Supabase calls have `try/catch` with `localStorage` fallbacks to ensure the app works even without a live DB connection.

### Backend (Node + Express)
- **Hybrid Data Flow**:
    - **Supabase**: Handles `neighborhoods`, `proposals`, and `settings`.
    - **Mock Data**: Everything else (posts, marketplace, events, etc.) is in `Backend/src/mockData.js`.
- **Route Registration**: Registration order in `Backend/src/app.js` is critical. Supabase routes MUST be registered before mock data routes to avoid catch-all overrides.
- **Data Transformation**: Backend converts Supabase `snake_case` columns to `camelCase` for frontend consumption.

---

## 📏 Coding Standards & Conventions

### General Rules
- **Strict TypeScript**: No `any`. Use interfaces from `types.ts`.
- **Path Aliases**: Use `@/` for `frontend/src/`.
- **Naming**: 
    - Components: `PascalCase`
    - Functions/Variables: `camelCase`
    - Files: Match component name or `kebab-case` for utilities.
- **Errors**: Always implement user-friendly error handling with `sonner` for notifications.

### React Component Structure
1.  Imports (React, Components, Services, Types).
2.  Type definitions (if local).
3.  Component definition.
4.  Hooks (useNavigate, useParams, useState, useEffect).
5.  Render logic with Tailwind classes.

### Adding New Features
1.  **Define Types**: Add to `frontend/src/app/services/types.ts`.
2.  **Backend Route**: Create in `Backend/src/routes/` and register in `app.js`.
3.  **Frontend Service**: Add methods to `storage.ts`.
4.  **UI Screen**: Create in `frontend/src/app/screens/` and register in `routes.ts`.

---

## 🔑 Key Files & Paths

- `frontend/src/main.tsx`: Entry point.
- `frontend/src/app/App.tsx`: App wrapper with providers.
- `frontend/src/app/routes.ts`: Central routing config.
- `frontend/src/app/services/storage.ts`: Core data orchestration.
- `Backend/src/server.js`: API entry point.
- `Backend/src/mockData.js`: In-memory data store for non-Supabase features.

---

## 🗄 Database Schema (Supabase)

Key tables used for neighborhood orchestration:
- `neighborhoods`: Core metadata (name, city, branding, guidelines).
- `neighborhood_settings`: Feature flags (marketplace, events, etc.).
- `neighborhood_members`: Mapping users to neighborhoods with roles.
- `neighborhood_proposals`: User submissions to create new neighborhoods.

---

## 🎨 Design System
- **Colors**: Use the theme defined in `frontend/default_shadcn_theme.css`.
- **Layout**: Mobile-first design but responsive for desktop.
- **Feedback**: Use `sonner` for toast notifications on success/error.
- **Loading**: Use skeletons or subtle spinners for async operations.
