# Minimal Changes to Existing Files - Neighborhood Services Integration

This document tracks intentional edits to **existing** project files (excluding new standalone files). Use it when reviewing diffs or planning merges.

---

## Backend (original integration)

### Summary (initial work)

Only **2 existing files** required modifications for the first backend integration wave. New controllers/routes lived in new files.

**Files modified:**

1. `Backend/src/app.js` — route registration for admin provider-applications and admin services.
2. `Backend/src/routes/adminRoutes.js` — dashboard provider applications query filtered by neighborhood and joined with `users`.

### `Backend/src/app.js`

- Import and mount `adminProviderApplicationsRoutes` and `adminServiceManagementRoutes` under `/api/admin/...`.

### `Backend/src/routes/adminRoutes.js`

**Dashboard provider applications query**

- **Before:** `select('*')` (unscoped).
- **After:** `select('*, users(id, name, email, verified, avatar)').eq('neighborhood_id', neighborhoodId).order('created_at', { ascending: false })`.

---

## Frontend (provider review UI, Services tab, Home flags)

### `frontend/src/app/screens/AdminDashboard.tsx`

- Import and render **`ProviderApplicationReviewCard`** for the Providers tab instead of inline markup.
- Applications state typed as **`ProviderApplicationRow[]`**; status updates compare ids with **`String(...)`** so numeric API ids match.
- Removed unused icon imports from the old approve/reject buttons.

### `frontend/src/app/components/BottomNav.tsx`

- **Services / Market flags:** `enable_services` and `enable_marketplace` are treated as **on unless explicitly `false`**, so missing keys do not disable tabs (matches typical DB defaults).
- **Superadmin / platform admin Services access:** Services tab stays usable if the user is in the **`Superadmin`** table **or** `authService.getCurrentUser().isAdmin === true`.
- **Superadmin detection:** Query uses **numeric** `user_id` (`parseInt` from current user id or `localStorage.user_id`); effect **re-runs** on **`location.pathname`** and **`neighborhood.id`** so the check runs after auth and neighborhood data load (fixes one-shot mount race).

### `frontend/src/app/screens/Home.tsx`

- **Quick action feature flags:** Same semantics as bottom nav — **`!== false`** instead of truthy coercion, so an unset `enable_services` does not block the Service shortcut.
- **Services shortcut for `isAdmin`:** If `enable_services` is false but **`currentUser.isAdmin`**, the Service quick action still works (platform admin).
- **Superadmin Supabase check:** **`user_id`** filter uses **numeric** id parsed from `currentUser.id` (consistent with integer column in DB).

---

## Neighborhood-Linked Services & Applications (latest iteration)

Updates to ensure services and provider applications are **properly scoped to neighborhoods**.

### `Backend/src/routes/supabaseProviderApplicationsRoutes.js`

**POST `/provider-applications` — Create application**
- **Before:** Only accepted `userId, category, experience, description`. No `neighborhood_id` stored.
- **After:** Now accepts and **requires** `neighborhoodId` in request body. Stores `neighborhood_id` and `status: 'pending'` explicitly.
- **Validation:** Returns 400 if `neighborhoodId` is missing or invalid.

**GET `/provider-applications` — Fetch applications**
- **Before:** Fetched **all applications globally** (no filtering).
- **After:** Now supports optional `?neighborhoodId=X` query param. If provided, **filters to that neighborhood only**.
- **Ordering:** Changed from `order('id', { ascending: false })` to `order('created_at', { ascending: false })` for consistency.

### `frontend/src/app/services/storage.ts`

**`submitApplication()` function**
- **Before:** Sent only `userId, fullName, category, experience, description`.
- **After:** Now reads user's `neighborhoodId` via `authService.getCurrentUser()` and **sends `neighborhoodId` with the request**.
- Ensures provider application is tagged with the neighborhood at creation time.

**`getApplications()` function**
- **Before:** Called `GET /provider-applications` (no filtering, returned all globally).
- **After:** Now reads user's `neighborhoodId` and calls `GET /provider-applications?neighborhoodId=X` to fetch **only that neighborhood's applications**.
- Admin dashboard and provider application list now show only **neighborhood-scoped data**.

---

## Backend (services listing & service requests)

### `Backend/src/routes/supabaseServicesRoutes.js`

- **GET `/services`:** Neighborhood filter uses **`.or(neighborhood_id.eq.N,neighborhood_Id.eq.N)`** when `neighborhoodId` is present.
  - **Default (local / browse):** `moderation_status` in **`active`** or **`approved`** only — **`inactive`** listings are excluded from the public list.
  - **`listScope=provider_owned` + `providerId` + `neighborhoodId`:** Returns that provider’s listings in that neighborhood with `moderation_status` in **`active`**, **`inactive`**, or **`approved`** (for Provider Hub “My Service Listings”).
- **GET `/services/:id`:** Uses **`moderation_status` in (`approved`, `active`)** (detail view for browsable listings only).

### `Backend/src/routes/supabaseServiceRequestsRoutes.js`

- **GET `/service-requests`:** If **neither** `userId` nor `providerId` is passed, respond with **`[]`** instead of returning every request.

---

## Frontend (services visibility & requests scope)

### `frontend/src/app/screens/Services.tsx`

- List filter hides **`inactive`** and otherwise allows **`active`**, **`approved`**, or unset **`status`** (aligned with `moderation_status` → `status` from the API).
- **Provider UI:** Treats the user as a provider when **`isProvider` or `isServiceProvider`** is true (matches `users` table columns and auth payload).

### `frontend/src/app/screens/ProviderDashboard.tsx`

- Loads provider-owned services via **`getServices({ providerListings: true })`** so **inactive** listings still appear in “My Service Listings” for the current neighborhood.

### `frontend/src/app/services/storage.ts`

- **`getServices(opts?)`:** Optional **`providerListings`** adds **`providerId`** and **`listScope=provider_owned`** to the services API query (requires backend neighborhood + provider scoping).

### `frontend/src/app/components/ProviderApplicationReviewCard.tsx`

- Root container uses **`mx-auto w-full`** so cards center within wide admin layouts.

### `frontend/src/app/screens/ServiceRequests.tsx`

- Always loads **`servicesService.getMyRequests()`** (API: **`?userId=`** current user, matching **`service_requests.user_id`**). Screen title **“Sent Requests”**; each row shows **Provider**. **`ProviderDashboard`** still uses **`getProviderRequests`** for providers managing incoming work.

### `frontend/src/app/services/types.ts`

- **`User`:** optional **`isServiceProvider`** so auth/API payloads align with TypeScript.

---

## Backend (auth profile & user JSON)

### `Backend/src/controllers/authController.js`

- **`toPublicProfile`:** Sets **`isProvider`** true when either **`isProvider`** or **`isServiceProvider`** is true on the row (handles camelCase / snake_case from Supabase). Keeps **`isServiceProvider`** for clients that read it.
- **`getMe`:** Loads the full **`users`** row by JWT **`id`** before **`toPublicProfile`** (JWT payload alone does not carry provider flags).

### `Backend/src/controllers/profileController.js`

- **`getProfile`:** Loads **`users`** by **`req.user.id`** before **`toPublicProfile`** (same JWT limitation as **`getMe`**).

### `Backend/src/routes/supabaseUsersRoutes.js`

- **`transformUser`:** **`isProvider`** is true if either **`isProvider`** or **`isServiceProvider`** (or snake_case equivalents) is true on the selected row.

---

## New files (no edits to unrelated existing code)

These were added without requiring broad refactors:

- `frontend/src/app/components/ProviderApplicationReviewCard.tsx` — provider application review layout and field normalization.

**Later updates (same file):** Header shows **applicant name** (plus verified badge) and **category** subtitle; duplicate **Applicant name** / **Applicant ID** rows removed from the body; **Email**, **Submitted**, **Experience**, **Description**, and rejection reason kept; root layout **`max-w-3xl w-full mx-auto`** for horizontal centering in admin views.

---

## How to access Services when a neighborhood has disabled it

1. **Direct URL:** Open `/services` in the browser (no route guard).
2. **Hub admin:** As neighborhood admin, open **Hub Settings**, turn **enable services** on, save.
3. **Superadmin / `isAdmin`:** After the BottomNav changes above, those users can use the Services tab even when the flag is **explicitly** false (if the client can read `Superadmin` or the user has `isAdmin: true`). If the `Superadmin` query fails (e.g. RLS), fix Supabase policies or set **`isAdmin`** on the user row used at login.

---

## Files intentionally not modified here

- Provider application **POST** route still does not persist `fullName` (not a column in `provider_applications`); display name comes from joined **`users.name`** in the admin dashboard payload.
