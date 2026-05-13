# Neighborhood Services Integration - Complete Implementation Guide

## Overview
This document outlines the necessary changes to implement neighborhood-linked providers, services, and service requests. The goal is to ensure all service-related features are scoped to specific neighborhoods.

---

## 1. DATABASE SCHEMA CHANGES

### 1.1 `provider_applications` Table
**Add the following columns:**

```sql
ALTER TABLE public.provider_applications ADD COLUMN neighborhood_id integer;
ALTER TABLE public.provider_applications ADD COLUMN status character varying DEFAULT 'pending';
ALTER TABLE public.provider_applications ADD COLUMN created_at timestamp without time zone DEFAULT now();

-- Add foreign key constraint
ALTER TABLE public.provider_applications 
ADD CONSTRAINT provider_applications_neighborhood_id_fkey 
FOREIGN KEY (neighborhood_id) REFERENCES public.neighborhoods(id);
```

**Rationale:** 
- `neighborhood_id`: Identifies which neighborhood the provider is applying to serve
- `status`: Tracks application state (pending, approved, rejected) - allows neighborhood admins to manage approvals
- `created_at`: Timestamp for sorting and tracking application age

---

### 1.2 `services` Table - No Changes Needed
The `services` table already has:
- ✅ `neighborhood_id` (links service to neighborhood)
- ✅ `availability` boolean (enables/disables service - set to false to disable)

**Current disable/enable mechanism:**
Services are currently disabled/enabled via the `availability` boolean field. When `availability = false`, the service should not appear in listings.

---

## 2. CURRENT STATE ANALYSIS

### 2.1 Provider Applications - Current Issues
- ❌ No `neighborhood_id` - cannot filter by neighborhood
- ❌ No `status` field - cannot track approval/rejection per neighborhood
- ✅ Has `user_id`, `category`, `experience`, `description`

### 2.2 Services - Current State
- ✅ Has `neighborhood_id` 
- ✅ Has `availability` boolean for enable/disable
- ✅ Already filtered by `neighborhood_id` in routes
- ❌ Frontend doesn't show neighborhood context in service listings

### 2.3 Service Requests - Current State
- ✅ Linked to neighborhood via `service_id → services.neighborhood_id` (FK relationship)
- ✅ Has `user_id`, `service_id`, `status`, `description`
- ✅ Neighborhood context available through service FK join
- ℹ️ No direct `neighborhood_id` column needed - service linkage is sufficient

---

## 3. BACKEND CHANGES

### 3.1 NEW FILE: Create Provider Application Controller
**File:** `Backend/src/controllers/providerApplicationController.js`

**Purpose:** Handle provider application approval/rejection per neighborhood

**Responsibilities:**
1. Get applications for a specific neighborhood
2. Approve/reject applications
3. Link approved user as provider to the neighborhood
4. Track application status per neighborhood

```javascript
// Key functions to implement:
- getApplicationsByNeighborhood(neighborhoodId)
- approveApplication(applicationId, neighborhoodId)
- rejectApplication(applicationId, neighborhoodId, reason)
- getUserApplicationForNeighborhood(userId, neighborhoodId)
```

---

### 3.2 MINIMAL CHANGES TO EXISTING FILES

#### A. `Backend/src/routes/supabaseProviderApplicationsRoutes.js`

**Current Issues:**
- Returns ALL applications globally
- No neighborhood filtering
- No status tracking

**Minimal Changes Needed:**

1. **Add GET route for neighborhood-specific applications:**
```javascript
// Get applications for a specific neighborhood (for admin dashboard)
router.get('/provider-applications/neighborhood/:neighborhoodId', async (req, res) => {
  // Returns only applications for that neighborhood
  // Shows status, user info, category, experience
});
```

2. **Add POST route to approve/reject applications:**
```javascript
// Update application status
router.put('/provider-applications/:id/status', async (req, res) => {
  // Updates status to 'approved' or 'rejected'
  // Only callable by neighborhood admin
  // Creates notification for user
});
```

3. **Keep existing routes but add status filtering:**
```javascript
// Existing GET /provider-applications should filter by status if provided
// Add query param: ?status=pending&neighborhoodId=123
```

---

#### B. `Backend/src/routes/supabaseServicesRoutes.js`

**Current State:**
- ✅ Already has neighborhood filtering in GET /services
- ✅ Already includes neighborhood_id in responses

**Minimal Changes Needed:**

1. **Add availability/disable endpoint:**
```javascript
// Update service availability status
router.patch('/services/:id/availability', async (req, res) => {
  // Toggle or set availability boolean
  // Only callable by service provider or admin
});
```

2. **Add query parameter for filtering enabled/disabled:**
```javascript
// GET /services?neighborhoodId=123&availabilityStatus=enabled
// Returns only available services (availability = true)
```

3. **Ensure service transformation includes neighborhood info:**
```javascript
// transformService should return:
// - neighborhoodName (for context)
// - neighborhoodId (already present)
```

---

#### C. `Backend/src/routes/supabaseServiceRequestsRoutes.js`

**Status:** ✅ NO CHANGES NEEDED

**Rationale:**
- Service requests are already properly linked to services via foreign key
- Neighborhood context is accessible through `service_id → services.neighborhood_id`
- No need to store direct `neighborhood_id` column (data redundancy)
- Existing service request operations are sufficient

---

#### D. `Backend/src/routes/adminRoutes.js`

**Current Route:** `/admin/dashboard/:neighborhoodId`

**Minimal Changes Needed:**

1. **Update provider applications fetch to be neighborhood-specific:**
```javascript
// Change from:
supabase.from('provider_applications').select('*')

// To:
supabase.from('provider_applications').select('*')
  .eq('neighborhood_id', neighborhoodId)
  .order('created_at', { ascending: false })
```

2. **Add status-based statistics:**
```javascript
// Include in dashboard stats:
// - Pending applications count
// - Approved providers count
// - Rejected applications count
```

3. **Update to include user details in applications response:**
```javascript
// Join with users table to get full name, email, verified status
.select('*, users(id, name, email, verified, avatar)')
```

---

### 3.3 NEW FILE: Provider Applications Service Helper
**File:** `Backend/src/services/providerApplications.service.js`

**Purpose:** Business logic for provider applications

**Functions:**
```javascript
// Get pending applications for a neighborhood
export async function getPendingApplications(neighborhoodId) { }

// Approve application - creates provider association
export async function approveApplication(applicationId, neighborhoodId) { }

// Reject application - stores rejection reason
export async function rejectApplication(applicationId, reason) { }

// Get user's application status for a neighborhood
export async function getUserApplicationStatus(userId, neighborhoodId) { }

// Check if user iService Management Controller & Routes
Created for managing service availability, statistics, and admin operations.

### 3.4 NEW FILE: s approved provider in neighborhood
export async function isApprovedProvider(userId, neighborhoodId) { }
```

---

## 4. FEATURES BREAKDOWN

### 4.1 Feature: Provider Applications Per Neighborhood

**Flow:**
1. User applies to be provider (already exists via `/provider-applications` POST)
2. Application gets `neighborhood_id` from request body
3. Neighborhood admin views pending applications in Admin Dashboard → Applications tab
4. Admin can approve (status = 'approved') or reject (status = 'rejected')
5. On approval: Create provider-neighborhood association (how?) 
6. Approved user can now create services for that neighborhood

**Note:** Need to clarify: How should we track which neighborhoods a user is approved as provider in?
- Option A: Check `provider_applications.status` when filtering services for that user
- Option B: Create separate `provider_neighborhoods` junction table
- Recommend Option A (simpler) unless multi-neighborhood provider support is needed

---

### 4.2 Feature: Services Linked to Neighborhood

**Current State:** ✅ Already implemented
- Services have `neighborhood_id`
- GET `/services?neighborhoodId=123` returns only that neighborhood's services
- Service creation should include `neighborhood_id`

**What's Missing:**
- Frontend should show only services relevant to user's neighborhood
- Service listing should display neighborhood context
- Disable/enable UI for neighborhood admins

**Implementation:**
- Use `availability` boolean to enable/disable services
- Add PATCH endpoint to toggle availability
- Only provider or neighborhood admin can toggle

---
✅ Already Sufficient
- Service requests linked to neighborhood via `service_id → services.neighborhood_id` relationship
- Can get neighborhood context through service FK join
- No additional column needed - FK relationship provides needed linkage
- No code changes necessaryod_id → store it
2. When querying requests → filter by neighborhood_id
3. Return neighborhood info in responses for UI context
4. Show only requests relevant to user's neighborhood context

---

## 5. ADMIN DASHBOARD INTEGRATION

### Current Admin Dashboard Tab: "Applications"

**What's There:**
- Lists all provider applications globally
- Shows: userId, category, experience, description, status

**What Should Change:**

1. **Filter to neighborhood-specific applications:**
   - Show only applications for current admin's neighborhood
   - Query: `provider_applications.neighborhood_id = currentNeighborhoodId`

2. **Add status filtering:**
   - Tabs for: Pending | Approved | Rejected
   - Show counts for each status

3. **Add action buttons:**
   - Approve button → updates status to 'approved' → sends notification
   - Reject button → updates status to 'rejected' + reason field → sends notification

4. **Enhance display:**
   - Show user details (name, email, avatar, verified status)
   - Show application date
   - Show any rejection reasons
   - Search by provider name

---

## 6. SUMMARY TABLE: What Changes Where

| Item | Current State | Change Required | File(s) |
|------|---------------|-----------------|---------|
| **Provider Applications** | No neighborhood_id | Add column | Database + routes |
| **Provider Applications** | No status field | Add column | Database + routes |
| **Service Requests** | No neighborhood_id | Add column | Database + routes |
| **Services - Disable/Enable** | availability boolean exists | Create PATCH endpoint | supabaseServicesRoutes.js |
| **Admin Dashboard** | Gets all applications | Filter by neighborhood | adminRoutes.js |
| **Approval Workflow** | Not implemented | Create approve/reject endpoints | NEW: providerApplicationController.js |

---s - Disable/Enable** | availability boolean exists | Create PATCH endpoint | New routes file
## 7. IMPLEMENTATION CHECKLIST

### Database
- [ ] Add `neighborhood_id` to `provider_applications`
- [ ] Add `status` to `provider_applications`
- [ ] Add `created_at` to `provider_applications`
- [ ] Add `neighborhood_id` to `service_requests`
- [ ] Run migrations in Supabase

### Backend - Routes & Controllers
- [ ] Create `providerApplicationController.js` with approve/reject logic
- [ ] Create `providerApplications.service.js` for business logic
- [ ] Run migrations in Supabase

### Backend - Routes & Controllers
- [ ] Create `providerApplicationController.js` ✅ DONE
- [ ] Create `providerApplications.service.js` ✅ DONE
- [ ] Create `adminProviderApplicationsRoutes.js` ✅ DONE
- [ ] Create `serviceManagementController.js` ✅ DONE
- [ ] Create `adminServiceManagementRoutes.js` ✅ DONE
- [ ] Update `adminRoutes.js` to filter applications by neighborhood ✅ DONE
- [ ] Update `app.js` to register new routes ✅ DONE

### Backend - Integration
- [ ] Ensure all provider application endpoints check authorization (admin only)
- [ ] Add notifications when applications are approved/rejected
- [ ] Service requests left untouched (FK relationship sufficient)ighborhood
- [ ] Add status badges for applications

---

## 8. QUERY EXAMPLES

### Get pending applications for a neighborhood
```sql
SELECT * FROM provider_applications 
WHERE neighborhood_id = 123 AND status = 'pending'
ORDER BY created_at DESC;
```

### Get active services for a neighborhood
```sql
SELECT * FROM services 
WHERE neighborhood_id = 123 AND availability = true 
ORDER BY created_at DESC;
```

### Get service requests for a neighborhood with details
```sql
SELECT sr.*, 
  s.title as service_title, 
  s.neighborhood_id,
  u.name as requester_name 
FROM service_requests sr
JOIN services s ON sr.service_id = s.id
JOIN users u ON sr.user_id = u.id
WHERE s.neighborhood_id = 123
ORDER BY sr.request_date DESC;
```

### Check if user is approved provider in neighborhood
```sql
SELECT * FROM provider_applications 
WHERE user_id = 456 AND neighborhood_id = 123 AND status = 'approved';
```

---

## 9. NOTES & CONSIDERATIONS

1. **Provider Multi-Neighborhood Support:** Current design supports a user being approved in multiple neighborhoods, but we only store status per application. If provider is approved, should they be able to create services in that neighborhood? Yes.

2. **Service Availability Logic:**
   - `availability = true` → service is active and visible
   - `availability = false` → service is hidden/disabled
   - Only provider or admin should be able to toggle
   - Should log who disabled/enabled when

3. **Notification System:**
   - Notify user when application is approved/rejected
   - Notify admin when new application arrives
   - Notify users when service is disabled

4. **Authorization Checks:**
   - Only neighborhood admin can approve/reject provider applications
   - Only provider can disable their own service
   - Only neighborhood admin can disable any provider's service

5. **Backward Compatibility:**
   - Existing services already have neighborhood_id
   - New columns have defaults
   - No breaking changes to existing endpoints

---

## 10. PHASES (Recommended Implementation Order)

### Phase 1: Database + Basic Routes (Priority)
1. Add columns to database
2. Create providerApplicationController with approve/reject
3. Update adminRoutes to filter applications by neighborhood
4. Test provider application workflow

### Phase 2: Service Management (Priority)
1. Add PATCH endpoint for service availability
2. Update service routes to include disable/enable in responses
3. Test service enable/disable workflow

### Phase 3: Service Requests (Priority)
1. Add neighborhood_id to service_requests
2. Update service request routes to include neighborhood context
3. Add GET endpoint for neigh
✅ SKIPPED - Already properly linked via FK relationship to services table
2. Add service availability toggle UI
3. Show neighborhood context everywhere needed
