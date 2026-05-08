# Phase 2 — Location Verification (Join Neighbourhood)

## Overview

Phase 2 lets users join a neighbourhood by verifying their physical GPS location matches the neighbourhood's city. Location is captured via the browser Geolocation API and reverse-geocoded using the free Nominatim (OpenStreetMap) API.

**Binary outcome — no "pending" for location:**
- GPS matches neighbourhood city → user inserted into `neighborhood_members` with `status = 'verified'`
- GPS does not match → request rejected with HTTP 403, user is NOT added to the DB

---

## Architecture

```
User clicks "Join Neighbourhood"
        ↓
JoinNeighborhoodModal opens
        ↓
User clicks "Verify My Location"
        ↓
Browser requests GPS coordinates
        ↓
POST /api/neighborhoods/:id/join
  { latitude, longitude, userId }
        ↓
Backend:
  1. Fetch user from users table
  2. Fetch neighbourhood city/state from neighborhoods table
  3. Reverse geocode coordinates via Nominatim API
  4. Run locationsMatch() — 5-level smart matching
        ↓
  MATCH → INSERT neighborhood_members (status='verified')
        → checkAndSetUserVerified(userId)
        → 201 { success, matched: true, status: 'verified' }
        ↓
  NO MATCH → 403 { code: 'LOCATION_MISMATCH', ... }
             (nothing inserted in DB)
```

---

## Smart Location Matching (`locationsMatch`)

Handles Nominatim's inconsistent hierarchy for Pakistani cities (e.g. GPS in Rawalpindi area returns no `city` field but the display name contains "Islamabad").

**5-level cascade:**
1. Exact city match: `geolocation.city === neighborhoodCity`
2. Any geocoded token equals neighbourhood city
3. Any geocoded token contains neighbourhood city as substring (e.g. "Islamabad Capital Territory" contains "islamabad")
4. Neighbourhood city appears anywhere in the full Nominatim `display_name`
5. State abbreviation expansion (e.g. `"IS"` → `"islamabad"`) checked against display name

**Pakistani state abbreviations mapped:**
```
IS  → islamabad
PB  → punjab
KPK → khyber pakhtunkhwa
SD  → sindh
BL  → balochistan
GB  → gilgit baltistan
AJK → azad kashmir
```

---

## Database Tables

### `neighborhood_members`
```sql
id                  SERIAL PRIMARY KEY
user_id             VARCHAR(255) NOT NULL   -- stored as string
neighborhood_id     INTEGER NOT NULL REFERENCES neighborhoods(id)
joined_date         TIMESTAMP DEFAULT NOW()
status              TEXT DEFAULT 'pending'  -- 'verified' (location matched)
verified_at         TIMESTAMP WITH TIME ZONE
user_location_city  TEXT                    -- city from Nominatim
user_location_state TEXT
UNIQUE(user_id, neighborhood_id)
```

> Note: `user_id` is `VARCHAR` in this table even though `users.id` is `INTEGER`. The backend converts with `String(userId)` before inserting.

### `neighborhoods`
```sql
id    SERIAL PRIMARY KEY
name  VARCHAR
city  VARCHAR    -- matched against GPS result
state VARCHAR    -- e.g. "Islamabad" or abbreviation "IS"
```

---

## Backend Files

### `Backend/src/routes/membershipRoutes.js`

**Key functions:**

`reverseGeocode(lat, lng)` — calls Nominatim, returns:
```js
{
  city, suburb, county, state, country,
  displayName,
  allTokens: [city, suburb, county, state, country].filter(Boolean).map(lowercase)
}
```

`locationsMatch(geolocation, neighborhoodCity, neighborhoodState)` — returns `true`/`false`

`checkAndSetUserVerified(userId)` — queries both `verification_requests` (approved) and `neighborhood_members` (verified). If both exist, sets `users.verified = true`.

**Other routes in this file:**
- `GET /api/neighborhoods/:id/members/count` — public member count
- `DELETE /api/neighborhoods/:id/leave` — leave a neighbourhood
- `GET /api/neighborhoods/:id/members` — list members
- `GET /api/neighborhoods/:id/members/check` — check membership status
- `GET /api/user/:userId/memberships` — all memberships for a user

### `Backend/src/routes/supabaseNeighborhoodsRoutes.js`

Contains `GET /users/:userId/neighborhood` which returns the user's current neighbourhood. Coerces `userId` to integer before querying.

---

## API Endpoints

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| `POST` | `/api/neighborhoods/:id/join` | None (userId in body) | `{ latitude, longitude, userId }` | `201 { matched: true, status: 'verified' }` or `403 { code: 'LOCATION_MISMATCH' }` |
| `GET` | `/api/neighborhoods/:id/members/count` | None | — | `{ count }` |
| `DELETE` | `/api/neighborhoods/:id/leave` | None | — | `{ success }` |
| `GET` | `/api/neighborhoods/:id/members/check` | None | — | `{ isMember, status }` |
| `GET` | `/api/user/:userId/memberships` | None | — | `{ memberships[] }` |
| `GET` | `/users/:userId/neighborhood` | None | — | `{ neighborhood }` |

---

## Frontend Files

### `frontend/src/app/components/JoinNeighborhoodModal.tsx`

**Modal states:**
```
idle              → "Verify My Location" button
requesting-location → waiting for browser GPS permission
verifying         → calling backend, showing coordinates
success           → location matched, joined as verified (auto-closes in 2s)
rejected          → location mismatch, NOT joined, shows comparison
denied            → browser permission denied
error             → network/server error
```

**On success:** calls `onJoinSuccess()` callback → parent refreshes member count.

**On rejected (403):** shows user location vs required location, "Try Again" and "Close" buttons. User is NOT added to the neighbourhood.

### `frontend/src/app/screens/BrowseNeighborhoods.tsx`

- "Join Neighbourhood" and "Switch Neighbourhood" buttons both open `JoinNeighborhoodModal`
- Uses `localStorage.getItem('user_id')` (real integer ID) for `getUserNeighborhood()` — not the mock service ID
- `handleJoinSuccess()` refreshes the neighbourhood list after joining

### `frontend/src/app/screens/NeighborhoodDetail.tsx`

- "Join This Neighbourhood" button opens `JoinNeighborhoodModal`
- Uses `localStorage.getItem('user_id')` for `getUserNeighborhood()`

### `frontend/src/app/services/storage.ts`

`getUserNeighborhood(userId?)` — always reads `localStorage.getItem('user_id')` first, falls back to mock only if nothing in localStorage.

---

## `users.verified` Flag

`users.verified` is set to `true` only when **both** conditions are met:
1. `verification_requests` has a row with `status = 'approved'` for this user (Phase 3)
2. `neighborhood_members` has a row with `status = 'verified'` for this user (Phase 2)

`checkAndSetUserVerified(userId)` is called after every successful location join.

---

## Backend Terminal Debug Output

```
[JOIN] neighborhoodId=3 userId=6 lat=33.6844 lon=73.0479
[JOIN] User="Alex Thompson" joining "NUST" (Islamabad, IS)
[JOIN] Geocode result:
  city="" suburb="Korang Town" county="Rawalpindi District" state="Punjab"
  displayName="Korang Town, ..., Islamabad, Pakistan"
  allTokens=["korang town","rawalpindi district","punjab","pakistan"]
  Neighborhood expects: city="Islamabad" state="IS"
[JOIN] locationMatches=true   ← matched via displayName containing "islamabad"
[JOIN] New verified membership created
[VERIFIED CHECK] userId=6 docApproved=false locVerified=true → setVerified=false
```

---

## Testing Checklist

- [ ] Click "Join Neighbourhood" → modal opens
- [ ] Click "Verify My Location" → browser asks for GPS permission
- [ ] Allow permission → coordinates shown → backend called
- [ ] GPS in correct city → "Location Verified!" success state → auto-closes
- [ ] `neighborhood_members` row inserted with `status='verified'`
- [ ] GPS in wrong city → "Location Mismatch — Not Joined" rejected state
- [ ] No row inserted in `neighborhood_members` on rejection
- [ ] Deny browser permission → "Location Access Denied" state
- [ ] "Try Again" resets modal to idle
- [ ] Member count increments after successful join
- [ ] "Leave Neighbourhood" removes the row
- [ ] BrowseNeighborhoods shows "View My Neighborhood" only for actual DB member