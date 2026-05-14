# Neighborhood Services Integration - Quick Reference & Checklist

## 🎯 What You're Implementing

Two main features to make services neighborhood-aware:

1. **Provider Applications Per Neighborhood** - Admins approve/reject providers per neighborhood
2. **Services Linked to Neighborhoods** - Visibility & enable/disable per neighborhood
3. **Service Requests** - Already linked via FK to services (no additional changes needed)

---

## 📋 Implementation Checklist

### Phase 1: Database Setup
- [ ] Add `neighborhood_id` to `provider_applications` table
- [ ] Add `status` to `provider_applications` table ('pending', 'approved', 'rejected')
- [ ] Add `created_at` to `provider_applications` table
- [ ] Add `updated_at` to `provider_applications` table  
- [ ] Add `rejection_reason` to `provider_applications` table
- [ ] Add foreign key constraint on `neighborhood_id` in `provider_applications`
- [ ] Add `neighborhood_id` to `service_requests` table
- [ ] Add foreign key constraint on `neighborhood_id` in `service_requests`
- [ ] Verify `services` table already has `neighborhood_id` and `availability` columns
- [ ] Add `updated_at` column to `services` table if not present

### Phase 2: Backend - New Files (ALREADY CREATED)
✅ `Backend/src/controllers/providerApplicationController.js` - 6 main functions
✅ `Backend/src/services/providerApplications.service.js` - 10 helper functions
✅ `Backend/src/controllers/serviceManagementController.js` - 4 functions
✅ `Backend/src/controllers/serviceRequestManagementController.js` - 4 functions
✅ `Backend/src/routes/adminProviderApplicationsRoutes.js` - 6 endpoints
✅ `Backend/src/routes/adminServiceManagementRoutes.js` - 4 endpoints
✅ `Backend/src/routes/adminServiceRequestManagementRoutes.js` - 4 endpoints

### Phase 3: Testing
- [ ] Test provider application approval workflow
- [ ] Test service availability toggle
- [ ] Verify neighborhood isolation (data from one neighborhood doesn't leak to another)

---

## 📁 New Files Created

| File | Purpose | Key Exports |
|------|---------|-------------|
| `providerApplicationController.js` | Handle approval/rejection logic | 6 async functions |
| `providerApplications.service.js` | Business logic helpers | 10 utility functions |
| `serviceManagementController.js` | Service enable/disable logic | 4 async functions |
| `adminProviderApplicationsRoutes.js` | Provider app API routes | 6 endpoints |
| `adminServiceManagementRoutes.js` | Service management API routes | 4 endpoints |

---

## 🔄 Data Flow Examples

### Flow 1: Provider Application Approval
```
User applies to be provider
  ↓
POST /provider-applications with { userId, category, experience, neighborhood_id }
  ↓
Admin views: GET /api/admin/provider-applications/neighborhood/123?status=pending
  ↓
Admin clicks Approve: POST /api/admin/provider-applications/5/approve
  ↓
Status updated to 'approved'
Notification sent to user
User can now create services in that neighborhood
```

### Flow 2: Service Disable/Enable
```
Provider creates service in neighborhood
  ↓
Service appears with availability = true
  ↓
Provider or admin toggles: PATCH /api/admin/services/42/availability { available: false }
  ↓
Service hidden from listings
  ↓
When toggled back to true, service reappears
```

### Flow 3: Service Requests
```
User requests a service in neighborhood
  ↓
POST /service-requests with { userId, serviceId, description }
  ↓
Request linked to service via FK
  ↓
Neighborhood context accessible through: service_id → services.neighborhood_id
  ↓
No direct neighborhood_id column needed - FK relationship provides full context
```

---

## 📊 Database Schema Summary

### `provider_applications` Table (Modified)
```sql
id (PK)
user_id (FK → users)
neighborhood_id (FK → neighborhoods) ✨ NEW
category
experience
description
status ✨ NEW (pending | approved | rejected)
created_at ✨ NEW
rejection_reason ✨ NEW (stores rejection reason if rejected)
```

### `services` Table (Existing - No Changes Needed)
```sql
id (PK)
provider_id (FK → users)
neighborhood_id (FK → neighborhoods) ✅ Already exists
category
title
description
rating
review_count
price
availability ✅ Boolean - use to enable/disable
is_flagged
moderation_status
```

### `service_requests` Table (No Changes - FK Sufficient)
```sql
id (PK)
user_id (FK → users)
service_id (FK → services) ✅ Provides neighborhood linkage
status
request_date
scheduled_date
description

✨ NOTE: Neighborhood context accessible via service_id → services.neighborhood_id FK
```

---

## 🔗 API Endpoints Overview

### Provider Applications Management
```
GET    /api/admin/provider-applications/neighborhood/:neighborhoodId
GET    /api/admin/provider-applications/stats/:neighborhoodId
GET    /api/admin/provider-applications/user-status/:userId/:neighborhoodId
GET    /api/admin/provider-applications/user-neighborhoods/:userId
GET    /api/admin/provider-applications/check/:userId/:neighborhoodId
POST   /api/admin/provider-applications/:applicationId/approve
POST   /api/admin/provider-applications/:applicationId/reject
```

### Service Management
```
GET    /api/admin/services/neighborhood/:neighborhoodId
GET    /api/admin/services/stats/:neighborhoodId
GET    /api/admin/services/disabled/:neighborhoodId
PATCH  /api/admin/services/:serviceId/availability
```

### Service Requests Analytics
✅ SKIPPED - Neighborhood linkage via FK relationship is sufficient

No separate endpoints needed. Service requests are already linked to neighborhood through:
`service_requests.service_id → services.neighborhood_id` (FK relationship)

---

## 🛡️ Authorization Considerations

These endpoints should be protected. Add middleware to verify:

- **Neighborhood Admin Only**: Provider application approval/rejection, service disable/enable
- **System Admin Only**: View cross-neighborhood analytics
- **Provider**: Can view own service requests and disable own services
- **User**: Can only view their own requests

Example middleware checks:
```javascript
// Check if user is admin of neighborhood
isNeighborhoodAdmin(userId, neighborhoodId)

// Check if user is provider in neighborhood
isApprovedProvider(userId, neighborhoodId)

// Check if user is system admin
isSuperAdmin(userId)
```

---

## 📝 SQL Commands for Database Migration

Run in Supabase SQL Editor:

```sql
-- 1. Modify provider_applications table
ALTER TABLE public.provider_applications 
ADD COLUMN neighborhood_id integer,
ADD COLUMN status character varying DEFAULT 'pending',
ADD COLUMN created_at timestamp without time zone DEFAULT now();

ALTER TABLE public.provider_applications 
ADD CONSTRAINT provider_applications_neighborhood_id_fkey 
FOREIGN KEY (neighborhood_id) REFERENCES public.neighborhoods(id);
```

**Note:** No changes to service_requests table needed. No updated_at logic needed.

---

## 🚀 How to Deploy

### Step 1: Database
Run the SQL commands above in Supabase

### Step 2: Code
1. Copy new controller files to `Backend/src/controllers/`
2. Copy new service file to `Backend/src/services/`
3. Copy new route files to `Backend/src/routes/`
4. Update existing files per `MINIMAL_EXISTING_FILE_CHANGES.md`

### Step 3: Register Routes
Update `Backend/src/app.js` with new route imports and registrations

### Step 4: Restart Backend
`cd Backend && npm run dev`

### Step 5: Test
Use the endpoints listed above

---
Make minimal updates to 2 existing files per `BACKEND_CHANGES_APPLIED
## 📈 Key Metrics Available

After implementation, you can track:

- **Provider Applications**: Pending, approved, rejected counts per neighborhood
- **Service Performance**: Available, disabled, flagged service counts
- **Service Requests**: Status distribution, conversion rates, pending count
- **Provider Metrics**: Request volume, response rate, completion rate per provider
- **Category Analysis**: Which service categories are in demand

---

## 🎓 Understanding the Architecture

### Three Layers:

1. **Controllers** - Handle HTTP requests/responses
   - `providerApplicationController.js` - 6 endpoints
   - `serviceManagementController.js` - 4 endpoints  
   - `serviceRequestManagementController.js` - 4 endpoints

2. **Services** - Business logic
   - `providerApplications.service.js` - 10 helper functions
   - Handles complex queries and data transformations

3. **Routes** - URL mappings
   - `adminProviderApplicationsRoutes.js` - Maps to controller
   - `adminServiceManagementRoutes.js` - Maps to controller
   - `adminServiceRequestManagementRoutes.js` - Maps to controller

### Request Flow:
```
Request → Route → Controller → Service Layer → Supabase → Response
```

---

## ⚠️ Important Notes

1. **Backward Compatibility**: Existing endpoints continue to work
2. **No Breaking Changes**: All updates are additive
3. **Neighborhood Isolation**: Ensure queries always filter by neighborhood
4. **Notifications**: Approval/rejection events should trigger notifications
5. **Audit Trail**: Consider logging who approved/rejected applications

---

## 📞 Quick Reference

| Task | Endpoint | File |
|------|----------|------|
| List pending apps | GET /admin/provider-applications/neighborhood/:id | adminProviderApplicationsRoutes.js |
| Approve app | POST /admin/provider-applications/:id/approve | adminProviderApplicationsRoutes.js |
| Disable service | PATCH /admin/services/:id/availability | adminServiceManagementRoutes.js |
| View requests | GET /admin/service-requests/neighborhood/:id | adminServiceRequestManagementRoutes.js |
| Check provider status | GET /admin/provider-applications/check/:userId/:neighborhoodId | adminProviderApplicationsRoutes.js |

---

## 🎯 Success Criteria

Implementation is complete when:

- ✅ Providers apply with neighborhood specified
- ✅ Admins see applications filtered by their neighborhood
- ✅ Admins can approve/reject with notifications sent
- ✅ Services can be enabled/disabled per neighborhood
- ✅ Users only see services for their neighborhood
- ✅ Service requests tracked with neighborhood context
- ✅ Analytics show per-neighborhood metrics
- ✅ Data isolation verified (no cross-neighborhood leakage)
