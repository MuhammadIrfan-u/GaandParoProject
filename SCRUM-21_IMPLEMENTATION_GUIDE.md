# SCRUM-21: Forced Verification Implementation Guide

## 🎯 What You're Building

You're implementing **Forced Verification** - a feature that blocks unverified users from accessing neighborhoods that require verification. This works hand-in-hand with the **Document Verification** feature your teammate already built.

---

## 📋 Current State vs Your Task

### ✅ What's Already Done (by your teammate)
- Document verification system (Phase 3)
- Users can upload ID/documents
- Admin can review and approve
- `users.verified` gets set to `true` after approval
- Frontend has verification toggle in HubSettings
- Database has `require_verification` column in `neighborhood_settings`

### ❌ What You Need to Do (SCRUM-21)
- Create middleware to **ENFORCE** verification
- Apply middleware to neighborhood content routes
- Handle errors gracefully on frontend
- Test the entire flow

---

## 🚀 Implementation Steps

### Step 1: Create the Middleware ✅ DONE

I've already created this file for you:
**`Backend/src/middleware/checkVerification.js`**

This middleware:
1. Checks if neighborhood requires verification
2. Checks if user is verified
3. Blocks access if not verified (returns 403 error)
4. Allows access if verified or verification not required

### Step 2: Apply Middleware to Routes

You need to add the middleware to routes that access neighborhood content.

#### 2.1: Update `supabaseEventsRoutes.js`

**File:** `Backend/src/routes/supabaseEventsRoutes.js`

Add at the top (around line 4):
```javascript
import { checkVerification } from '../middleware/checkVerification.js';
```

Modify these routes:

**Line 31-52 (GET /events):**
```javascript
// BEFORE:
router.get('/events', async (req, res) => {

// AFTER:
router.get('/events', checkVerification, async (req, res) => {
```

**Line 55-72 (GET /events/:id):**
```javascript
// BEFORE:
router.get('/events/:id', async (req, res) => {

// AFTER:
router.get('/events/:id', checkVerification, async (req, res) => {
```

**Line 74-138 (POST /events):**
```javascript
// BEFORE:
router.post('/events', async (req, res) => {

// AFTER:
router.post('/events', checkVerification, async (req, res) => {
```

#### 2.2: Update `supabasePostsRoutes.js`

**File:** `Backend/src/routes/supabasePostsRoutes.js`

Add at the top (around line 3):
```javascript
import { checkVerification } from '../middleware/checkVerification.js';
```

However, **PROBLEM**: This file doesn't have neighborhood context in the routes. You need to check if posts are tied to neighborhoods. If not, you might skip this file or modify it to accept neighborhoodId.

#### 2.3: Update `supabaseNeighborhoodsRoutes.js`

**File:** `Backend/src/routes/supabaseNeighborhoodsRoutes.js`

Add at the top (around line 3):
```javascript
import { checkVerification } from '../middleware/checkVerification.js';
```

Apply to these routes:

**Line 213 (GET /neighborhoods/:id) - View neighborhood details:**
```javascript
// Find this line (around 213):
router.get('/neighborhoods/:id', async (req, res) => {

// Change to:
router.get('/neighborhoods/:id', checkVerification, async (req, res) => {
```

**Line 991 (GET /neighborhoods/:id/members) - View members:**
```javascript
// Find this line (around 991):
router.get('/neighborhoods/:id/members', async (req, res) => {

// Change to:
router.get('/neighborhoods/:id/members', checkVerification, async (req, res) => {
```

**IMPORTANT:** Do NOT add it to the `/neighborhoods/:id/join` route (line 565) because users need to be able to JOIN before they can get verified!

#### 2.4: Update `membershipRoutes.js`

**File:** `Backend/src/routes/membershipRoutes.js`

Add at the top:
```javascript
import { checkVerification } from '../middleware/checkVerification.js';
```

Apply to:

**Line 513 (GET /neighborhoods/:id/members):**
```javascript
// BEFORE:
router.get('/neighborhoods/:id/members', async (req, res) => {

// AFTER:
router.get('/neighborhoods/:id/members', checkVerification, async (req, res) => {
```

---

### Step 3: Frontend Error Handling

Update the API error handler to redirect unverified users to the verification page.

#### 3.1: Find your API service file

Look for `frontend/src/app/services/api.ts` or similar. You need to add error handling for 403 responses with `requiresVerification: true`.

If you have a centralized API error handler, add this:

```typescript
// In your API error handler or axios interceptor
if (error.response?.status === 403 && error.response?.data?.requiresVerification) {
    const { message, neighborhoodName } = error.response.data;
    
    // Show a user-friendly message
    alert(`${neighborhoodName || 'This neighborhood'} requires verification. Redirecting to verification page...`);
    
    // Redirect to verification page
    window.location.href = '/verify-residence';
    
    return;
}
```

#### 3.2: Update DocumentVerificationScreen (Optional enhancement)

**File:** `frontend/src/app/screens/DocumentVerificationScreen.tsx`

After the user gets approved, show a "Return to Neighborhood" button if they came from a blocked page.

---

## 🧪 Testing Your Implementation

### Test Case 1: Unverified User Blocked
1. Create a test user (not verified)
2. As admin, enable "Require Verification" for a neighborhood (in HubSettings)
3. Try to view that neighborhood as the unverified user
4. **Expected:** 403 error, redirected to `/verify-residence`

### Test Case 2: User Verifies and Gets Access
1. Upload document as unverified user
2. Admin approves the document
3. Check database: `users.verified = true`
4. Try to view the neighborhood again
5. **Expected:** Access granted ✅

### Test Case 3: Neighborhood Without Verification Requirement
1. As admin, disable "Require Verification" for a neighborhood
2. Try to view as unverified user
3. **Expected:** Access granted (no verification needed)

### Test Case 4: Verified User Always Has Access
1. Create a verified user
2. Enable verification requirement on a neighborhood
3. View the neighborhood
4. **Expected:** Access granted immediately

---

## 🗂️ Files You'll Modify

### ✅ Created (by me):
- `Backend/src/middleware/checkVerification.js`

### ✏️ You Need to Edit:
1. `Backend/src/routes/supabaseEventsRoutes.js` - Add middleware import + apply to routes
2. `Backend/src/routes/supabaseNeighborhoodsRoutes.js` - Add middleware import + apply to routes
3. `Backend/src/routes/membershipRoutes.js` - Add middleware import + apply to routes
4. `frontend/src/app/services/api.ts` (or similar) - Add 403 error handling
5. (Optional) `frontend/src/app/screens/DocumentVerificationScreen.tsx` - Add return button

### ❌ Don't Touch:
- `Backend/src/routes/verificationRoutes.js` (already done by teammate)
- `Backend/src/routes/supabaseNeighborhoodsRoutes.js` line 565 (join route - users must be able to join!)
- Database schema (already has `require_verification`)

---

## 🔍 How to Check If It Works

### Backend Console Logs
When you apply the middleware, you'll see logs like:
```
[checkVerification] Checking user 6 for neighborhood 1
[checkVerification] Neighborhood 1 REQUIRES verification
[checkVerification] User 6 (John Doe) is NOT verified. Blocking access.
```

Or:
```
[checkVerification] User 6 (Jane Doe) is verified. Access granted.
```

### Frontend Network Tab
- Open DevTools → Network
- Try to access a verification-required neighborhood as unverified user
- You should see: **403 Forbidden** with response body:
```json
{
  "success": false,
  "message": "Access denied. Islamabad Neighborhood requires verified members...",
  "requiresVerification": true,
  "verified": false,
  "neighborhoodId": 1,
  "redirectTo": "/verify-residence"
}
```

---

## 📝 Git Workflow

```bash
# 1. Make sure you're on userManagement branch
cd ~/path/to/SPM
git checkout userManagement
git pull origin userManagement

# 2. Copy the middleware file I created
# (It's already in your local copy at Backend/src/middleware/checkVerification.js)

# 3. Make the route modifications listed in Step 2

# 4. Test everything!

# 5. Commit
git add Backend/src/middleware/checkVerification.js
git add Backend/src/routes/supabaseEventsRoutes.js
git add Backend/src/routes/supabaseNeighborhoodsRoutes.js
git add Backend/src/routes/membershipRoutes.js
# (add any other files you modified)

git commit -m "feat: Implement forced verification middleware (SCRUM-21)

- Created checkVerification middleware to enforce verification requirement
- Applied middleware to events, neighborhoods, and membership routes
- Blocks unverified users from accessing verification-required neighborhoods
- Returns 403 with redirect info for frontend handling
- Added frontend error handling for verification redirects

Acceptance Criteria:
✅ User redirected to document verification page if not verified
✅ Once verified by admin, user can browse neighborhood content

Co-authored-by: [Teammate Name] <teammate@email.com>"

# 6. Push
git push origin userManagement

# 7. Create Pull Request on GitHub
```

---

## 💬 Pull Request Template

**Title:** `SCRUM-21: Implement Forced Verification for Neighborhoods`

**Description:**
```markdown
## 🎯 What does this PR do?
Implements forced verification that blocks unverified users from accessing 
neighborhoods that have "Require Verification" enabled in settings.

## 🔗 How it works
1. Admin enables "Require Verification" in neighborhood settings
2. Middleware checks user verification status before allowing access
3. Unverified users get 403 error with redirect to `/verify-residence`
4. After document approval, users can access the neighborhood

## 📝 Changes Made
- ✅ Created `checkVerification` middleware
- ✅ Applied middleware to:
  - Events routes (GET /events, GET /events/:id, POST /events)
  - Neighborhood routes (GET /neighborhoods/:id, GET /neighborhoods/:id/members)
  - Membership routes (GET /neighborhoods/:id/members)
- ✅ Added frontend error handling for 403 verification errors
- ✅ Integrated with existing document verification system (Phase 3)

## 🧪 Testing Done
- [x] Unverified user blocked from verification-required neighborhood
- [x] User can upload document and get verified
- [x] Verified user gains access after approval
- [x] Neighborhoods without requirement remain accessible
- [x] Console logs show verification checks
- [x] 403 errors return proper redirect info

## ✅ Acceptance Criteria Met
- ✅ 1. User will get to document verification page
- ✅ 2. Once document verified from admin side, user can browse neighborhood

## 🔗 Related
- Depends on: Phase 3 Document Verification
- Ticket: SCRUM-21
- Integrates with: SCRUM-20 (Document Verification by [Teammate])
```

---

## ❓ Common Issues & Solutions

### Issue 1: Middleware not firing
**Symptom:** Users can access neighborhood without verification
**Solution:** Make sure you imported AND applied the middleware:
```javascript
import { checkVerification } from '../middleware/checkVerification.js';
// ...
router.get('/events', checkVerification, async (req, res) => {
//                    ^^^ Must be here!
```

### Issue 2: "Cannot find module" error
**Symptom:** Server crashes with module not found
**Solution:** Check the import path. It should be:
```javascript
import { checkVerification } from '../middleware/checkVerification.js';
// Note the .js extension!
```

### Issue 3: neighborhoodId is undefined
**Symptom:** Middleware always skips verification check
**Solution:** The middleware extracts `neighborhoodId` from:
- `req.params.id`
- `req.params.neighborhoodId`
- `req.body.neighborhoodId`
Make sure your route has one of these!

### Issue 4: All users blocked, even verified ones
**Symptom:** Even verified users get 403
**Solution:** Check the database:
```sql
SELECT id, name, verified FROM users WHERE id = YOUR_USER_ID;
```
Make sure `verified = true`. If not, the document wasn't approved properly.

---

## 🎓 Understanding the Code Flow

```
User tries to view Neighborhood X
           ↓
Route: GET /neighborhoods/:id
           ↓
Middleware: checkVerification
           ↓
    ┌─────────────────┐
    │ Check settings  │ → SELECT require_verification FROM neighborhood_settings
    └────────┬────────┘
             │
    require_verification = false → ✅ Allow (next())
             │
    require_verification = true
             ↓
    ┌─────────────────┐
    │ Check user      │ → SELECT verified FROM users
    └────────┬────────┘
             │
    verified = true  → ✅ Allow (next())
             │
    verified = false → ❌ Block (403 response)
                           ↓
                    Frontend catches 403
                           ↓
                    Redirect to /verify-residence
```

---

## 📞 Need Help?

Ask your teammate:
1. "Can you show me how the document verification endpoints work?"
2. "Which neighborhoods should I test with?"
3. "Do we have test users I can use?"

Check the console:
- Backend: `node Backend/src/server.js` (or `npm run dev`)
- Look for `[checkVerification]` logs

Check the database:
```sql
-- Check if verification is enabled
SELECT n.id, n.name, ns.require_verification 
FROM neighborhoods n 
JOIN neighborhood_settings ns ON n.id = ns.neighborhood_id;

-- Check user verification status
SELECT id, name, email, verified FROM users;
```

---

## ✅ Final Checklist Before PR

- [ ] Middleware file created at correct path
- [ ] Middleware imported in all necessary route files
- [ ] Middleware applied to correct routes (events, neighborhoods, members)
- [ ] NOT applied to join route
- [ ] Frontend handles 403 errors
- [ ] Tested with unverified user → blocked
- [ ] Tested with verified user → access granted
- [ ] Tested with non-required neighborhood → access granted
- [ ] Console logs are clean
- [ ] Code committed with good message
- [ ] PR description is complete

---

Good luck! You got this! 🚀
