# Phase 3 — Document Verification + Admin Review

## Overview

Phase 3 lets users prove their residence by uploading a photo of a government-issued ID or utility bill. Tesseract.js (running in Node — no external API) extracts text via OCR. A weighted scoring engine makes an automatic decision. Borderline cases go to an admin queue for manual review.

**`users.verified` is set to `true` only when BOTH Phase 2 (location) AND Phase 3 (document) are approved.**

---

## Decision Engine

Three signals are combined into a weighted score:

```
finalScore = 0.40 × ocrConfidence
           + 0.35 × nameMatch
           + 0.25 × addrMatch
```

| Signal | Weight | What it measures |
|---|---|---|
| `ocrConfidence` | 40% | Text extraction quality (word-level average from Tesseract, with fallbacks) |
| `nameMatch` | 35% | Fuzzy match between OCR-extracted name and registered name in DB |
| `addrMatch` | 25% | Whether OCR address contains the neighbourhood city/state |

**Thresholds (in `verificationRoutes.js`):**
```js
const THRESHOLDS = {
  AUTO_APPROVE: 0.85,  // finalScore >= 0.85 → auto-approved
  AUTO_REJECT:  0.40,  // finalScore <  0.40 → auto-rejected
  // 0.40–0.85 → pending admin review
};
```

### OCR Confidence Fallback Chain
Tesseract.js v7 sometimes returns empty `words` array. The system uses:
1. Word-level average confidence
2. Line-level average confidence
3. Top-level `data.confidence`
4. Heuristic: token count in raw text (≥10 tokens → 0.72, ≥5 → 0.65, ≥2 → 0.55)

### Name Matching (`fuzzyNameMatch`)
- Normalise both strings (lowercase, strip punctuation, split into tokens)
- **Containment check:** if all tokens of the shorter name appear in the longer → score 1.0
  - e.g. `"ALEX"` vs `"Alex Thompson"` → 1.0 (ALEX is contained in Alex Thompson)
- **Partial match:** `startsWith` check for abbreviated names → score × 0.85
- Handles reversed names: `"Ali Hassan"` vs `"Hassan Ali"` → 1.0

### Field Extraction
1. Labelled extraction: looks for `Name:`, `Full Name:`, `Address:`, etc.
2. Heuristic name: ALL-CAPS lines of 2–4 words → title-cased
3. Heuristic address: lines with commas, not starting with digits
4. OCR noise stripped: `[]|` characters removed from start/end

---

## Architecture

```
POST /api/verifications/upload
  1. Multer: file in memory (no disk), images only, max 5 MB
  2. Tesseract.js OCR → raw text + confidence
  3. Extract name + address (labelled then heuristic)
  4. Fetch registered name from users table
  5. Fetch neighbourhood city/state (if neighborhoodId provided)
  6. Compute signals → makeDecision()
  7. Upload image buffer to Supabase Storage (bucket: verification-documents)
  8. Generate 7-day signed URL
  9. INSERT into verification_requests
  10. If approved → addToNeighborhood() + checkAndSetUserVerified()
  11. Return { status, signals, extractedName, extractedAddress, _debug }

GET /api/verifications/my-status
  → latest verification_request for authenticated user
  → returns { status: 'none'|'pending'|'approved'|'rejected', ... }

GET /api/verifications/pending  (admin only)
  → all pending rows
  → manual user/neighbourhood lookups (no FK join — avoids type mismatch)
  → refreshes 2-hour signed URLs for document images

PUT /api/verifications/:id/review  (admin only)
  → update status + review_notes + reviewed_by
  → if approved → addToNeighborhood() + checkAndSetUserVerified()
```

---

## Database Tables

### `verification_requests`
```sql
id              SERIAL PRIMARY KEY
user_id         INTEGER NOT NULL
neighborhood_id INTEGER REFERENCES neighborhoods(id)
document_url    TEXT NOT NULL          -- signed URL (7-day for user, 2-hour for admin)
storage_path    TEXT                   -- internal path for URL refresh
ocr_text        TEXT                   -- full raw OCR output
ocr_name        VARCHAR                -- extracted name field
ocr_address     TEXT                   -- extracted address field
status          VARCHAR DEFAULT 'pending'
                CHECK (status IN ('pending','approved','rejected'))
review_notes    TEXT                   -- auto-decision note or admin note
reviewed_by     INTEGER                -- admin user ID
submitted_at    TIMESTAMP DEFAULT NOW()
reviewed_at     TIMESTAMP
```

### `users` (updated by this phase)
```sql
verified  BOOLEAN DEFAULT false
-- set to true when BOTH verification_requests.status='approved'
-- AND neighborhood_members.status='verified'
```

---

## Supabase Storage

**Bucket:** `verification-documents` (private — not public)

**Path format:** `{userId}/{timestamp}.{ext}`

**URL strategy:**
- User upload response: 7-day signed URL
- Admin dashboard: 2-hour signed URL (refreshed on each `/pending` call)
- Storage path saved in `storage_path` column for URL refresh

**Setup (one-time in Supabase Dashboard):**
1. Storage → New bucket → Name: `verification-documents` → Public: OFF
2. The backend uses the service role key so it bypasses RLS

---

## Backend Files

### `Backend/src/routes/verificationRoutes.js`

**Dependencies:** `express`, `multer`, `tesseract.js`, `@supabase/supabase-js`

**Key helpers:**
- `computeOcrConfidence(tesseractData, rawText)` — 4-level fallback
- `fuzzyNameMatch(a, b)` — bidirectional token overlap with containment bonus
- `addressMatchScore(ocrAddress, city, state)` — substring check, returns 0–1
- `makeDecision({ ocrConfidence, nameMatch, addrMatch })` — returns `{ decision, signals, autoReviewNote }`
- `extractField(text, labels)` — labelled field extraction
- `extractNameHeuristic(text)` — ALL-CAPS line detection
- `extractAddressHeuristic(text)` — comma-separated line detection
- `addToNeighborhood(userId, neighborhoodId)` — upserts into `neighborhood_members`
- `checkAndSetUserVerified(userId)` — checks both tables, sets `users.verified`

**Auth middleware used:**
- `requireAuth` — verifies JWT Bearer token
- `requireAdmin` — checks `req.user.isAdmin`

### `Backend/src/app.js`
```js
app.use("/api", verificationRoutes);
```

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/verifications/upload` | JWT required | Upload document, run OCR, get decision |
| `GET` | `/api/verifications/my-status` | JWT required | Get latest verification status |
| `GET` | `/api/verifications/pending` | JWT + admin | List all pending for admin review |
| `PUT` | `/api/verifications/:id/review` | JWT + admin | Approve or reject a submission |

### Upload request
```
Content-Type: multipart/form-data
Authorization: Bearer <token>

Fields:
  document      — image file (JPEG/PNG/WebP, max 5 MB)
  neighborhoodId — integer (optional)
```

### Upload response
```json
{
  "success": true,
  "id": 42,
  "status": "approved" | "pending" | "rejected",
  "autoDecided": true,
  "extractedName": "Alex Thompson",
  "extractedAddress": "Islamabad, Pakistan",
  "signals": {
    "ocrConfidence": 0.73,
    "nameMatch": 1.0,
    "addrMatch": 1.0,
    "finalScore": 0.892
  },
  "registeredName": "ALEX",
  "reviewNote": "Auto-approved. Score 0.892 ...",
  "_debug": {
    "rawOcrText": "ALEX THOMPSON\n...",
    "wordCount": 0,
    "ocrConfidence": 73.0
  }
}
```

---

## Frontend Files

### `frontend/src/app/screens/DocumentVerificationScreen.tsx`

**Route:** `/verify-residence`

**Status states:**
| Status | UI |
|---|---|
| `none` | Upload zone + neighbourhood dropdown |
| `pending` | Yellow "Under Review" banner, no re-upload |
| `approved` | Green "Residence Verified" banner + Go to Home |
| `rejected` | Red banner with rejection notes + re-upload zone |

**Upload flow:**
1. Drag-drop or click to select image (preview shown immediately)
2. Optional: select neighbourhood from dropdown
3. Click "Upload & Verify" → 3-step progress (Uploading → OCR → Submitted)
4. After response: shows extracted name/address, score breakdown bars, raw OCR toggle

**Score breakdown bars** (green ≥85%, yellow ≥65%, red <65%):
- OCR quality
- Name match
- Address match
- Overall score

**Raw OCR toggle:** collapsible `<pre>` showing full Tesseract output with confidence % in corner.

### `frontend/src/app/screens/SuperAdminDashboard.tsx`

**Verifications tab** (third tab, loaded lazily on first open):
- Fetches `GET /api/verifications/pending` with admin JWT
- Each card shows: user name/email, submitted date, document image, OCR fields, raw OCR (collapsible)
- **Approve** → immediate, removes card from list
- **Reject** → inline textarea for rejection notes → confirm → removes card
- Refresh button to reload the list
- Admin check uses `localStorage.getItem('is_admin')` — not the mock service

### `frontend/src/app/components/BottomNav.tsx`

"Verify" tab (ShieldCheck icon) → `/verify-residence` replaces the old "Services" tab.

### `frontend/src/app/routes.ts`

```ts
{ path: "/verify-residence", Component: DocumentVerificationScreen }
```

---

## Backend Debug Output

```
========== OCR DEBUG START ==========
File      : v3.PNG (image/png, 19.2 KB)
Words arr : 0 entries
Confidence: 73.0% (after fallback)
--- RAW OCR TEXT ---
ALEX THOMPSON
Islamabad, Pakistan
--- EXTRACTED FIELDS ---
  name    : Alex Thompson
  address : Islamabad, Pakistan
========== OCR DEBUG END ============

========== DECISION DEBUG ==========
User ID        : 6
Registered name: ALEX
OCR name       : Alex Thompson
OCR address    : Islamabad, Pakistan
Neighborhood   : Islamabad, IS
--- Signals ---
  OCR confidence : 73.0%  (weight 40%)
  Name match     : 100.0%  (weight 35%)
  Address match  : 100.0%  (weight 25%)
  Final score    : 89.2%
--- Decision ---
  → APPROVED
  Auto-approved. Score 0.892 ...
=====================================
```

---

## `users.verified` Logic

```
checkAndSetUserVerified(userId) is called after:
  - Auto-approve on upload
  - Admin manual approve via PUT /verifications/:id/review
  - Successful GPS location join (Phase 2)

It queries:
  verification_requests WHERE user_id = X AND status = 'approved'  → docApproved
  neighborhood_members  WHERE user_id = X AND status = 'verified'  → locVerified

If BOTH true → UPDATE users SET verified = true WHERE id = X
```

---

## Testing Checklist

- [ ] Upload a clear JPEG → OCR extracts name and address
- [ ] Score ≥ 0.85 → auto-approved, user added to `neighborhood_members`
- [ ] Score 0.40–0.85 → pending, appears in admin dashboard
- [ ] Score < 0.40 → auto-rejected, user sees rejection reason + can re-upload
- [ ] Admin dashboard Verifications tab loads pending submissions
- [ ] Document image visible in admin card (signed URL works)
- [ ] Admin approves → card removed, user added to `neighborhood_members`
- [ ] Admin rejects with notes → card removed, user sees rejection notes
- [ ] After both Phase 2 + Phase 3 approved → `users.verified = true` in DB
- [ ] Upload > 5 MB → 413 error
- [ ] Upload non-image → 400 error
- [ ] Unauthenticated upload → 401 error
- [ ] Non-admin accessing `/api/verifications/pending` → 403 error