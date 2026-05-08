# Phase 1 — Authentication with Email OTP

## Overview

Phase 1 implements a two-step login flow:
1. User enters email + password → credentials validated → 6-digit OTP sent to email
2. User enters OTP → verified → JWT issued → session started

Signup returns a JWT immediately (no OTP required on registration).

---

## Architecture

```
POST /api/auth/signup
  → validate fields
  → check email not already registered
  → INSERT into users table
  → sign JWT (userId, email, isAdmin)
  → return { token, user }

POST /api/auth/login  (Step 1)
  → validate email + password against users table
  → generate 6-digit OTP
  → store in in-memory Map<email, { otp, expiresAt, userId }>
  → send OTP email via Gmail (Nodemailer)
  → return { success, email }  ← NO token yet

POST /api/auth/verify-otp  (Step 2)
  → look up OTP in store
  → check not expired (10 min TTL)
  → check OTP matches
  → delete OTP from store (one-time use)
  → fetch full user from DB
  → sign JWT
  → return { token, user }

POST /api/auth/resend-otp
  → verify user exists
  → generate fresh OTP, replace in store
  → send new email
  → return { success }
```

---

## Database Tables Used

### `users`
```sql
id              SERIAL PRIMARY KEY
name            VARCHAR(100) NOT NULL
email           VARCHAR(150) UNIQUE NOT NULL
phone           VARCHAR(30)
address         TEXT
avatar          TEXT
verified        BOOLEAN DEFAULT false
reputation      INTEGER DEFAULT 0
joined_date     TIMESTAMP DEFAULT NOW()
bio             TEXT
is_admin        BOOLEAN DEFAULT false
password_hash   TEXT NOT NULL DEFAULT ''
```

> `verified` is set to `true` only when BOTH Phase 2 (location) AND Phase 3 (document) are approved.

---

## Backend Files

### `Backend/src/routes/authRoutes.js`

**Dependencies:** `express`, `jsonwebtoken`, `nodemailer`, `@supabase/supabase-js`

**OTP Store:** In-memory `Map` — fine for single-process dev. For production with multiple instances, move to Redis or a `otp_tokens` Supabase table.

**JWT payload:**
```js
{ userId: user.id, email: user.email, isAdmin: user.is_admin }
```
Expires in 7 days.

**Email template:** HTML email with large OTP digits, sent via Gmail SMTP.

**Dev mode fallback:** If Gmail is not configured or email send fails, the OTP is returned in the API response as `_devOtp` (only when `NODE_ENV !== 'production'`). It also prints to the backend terminal.

### `Backend/src/app.js`
```js
app.use("/api/auth", authRoutes);
```

---

## API Endpoints

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| `POST` | `/api/auth/signup` | None | `{ name, email, phone, address, password }` | `{ token, user }` |
| `POST` | `/api/auth/login` | None | `{ email, password }` | `{ success, email, _devOtp? }` |
| `POST` | `/api/auth/verify-otp` | None | `{ email, otp }` | `{ token, user }` |
| `POST` | `/api/auth/resend-otp` | None | `{ email }` | `{ success, _devOtp? }` |
| `GET` | `/api/auth/user/:userId` | None | — | `{ user }` |

---

## Frontend Files

### `frontend/src/app/screens/Login.tsx`

**Route:** `/login`

**Two-step state machine:**
```
step = "credentials"
  ↓ submit email + password
  ↓ POST /api/auth/login
  ↓ success → step = "otp"

step = "otp"
  ↓ enter 6-digit code
  ↓ POST /api/auth/verify-otp
  ↓ success → localStorage set → navigate("/home")
```

**Components inside Login.tsx:**
- `OtpInput` — 6 individual input boxes, auto-focus on next, paste support
- `Countdown` — live timer counting down from 10:00, turns red at 0:30

**localStorage keys set on successful login:**
```
auth_token   — JWT string
user_id      — integer user ID
user_name    — display name
user_email   — email address
is_admin     — "true" or "false"
```

**Dev mode:** If `_devOtp` is in the response, a blue toast shows the OTP for 30 seconds.

---

## Environment Variables

```env
# Backend/.env

JWT_SECRET=vnc_jwt_secret_phase3_2026
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_char_app_password
EMAIL_FROM="NeighborHub <your_gmail@gmail.com>"
OTP_EXPIRES_MINUTES=10
```

### Gmail App Password Setup
1. Enable 2FA on your Google account
2. Go to myaccount.google.com/apppasswords
3. Create an app password named "NeighborHub"
4. Paste the 16-character password into `EMAIL_PASS`

---

## OTP Security Properties

| Property | Implementation |
|---|---|
| Length | 6 digits (100,000–999,999) |
| TTL | 10 minutes (configurable via `OTP_EXPIRES_MINUTES`) |
| One-time use | Deleted from store immediately after successful verify |
| Brute force | No rate limiting yet (add in production) |
| Storage | In-memory Map (lost on server restart) |

---

## Testing Checklist

- [ ] Signup creates user in Supabase `users` table
- [ ] Signup returns JWT immediately
- [ ] Login with correct credentials → OTP sent to email
- [ ] OTP appears in backend terminal: `[OTP] Generated for x@x.com: 123456`
- [ ] Dev mode: OTP shown in browser toast if email fails
- [ ] Correct OTP → JWT returned → localStorage populated → redirect to /home
- [ ] Wrong OTP → "Incorrect OTP" error
- [ ] Expired OTP → "OTP expired" error
- [ ] Resend button generates new OTP and invalidates old one
- [ ] "← Change email" goes back to credentials step
- [ ] `is_admin = true` in localStorage for admin accounts