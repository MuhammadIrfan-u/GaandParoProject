# Neighborhood Module Integration Guide

## Overview
The Neighborhood Module is fully integrated into the Verified Neighborhood Community Frontend. It provides complete functionality for discovering, creating, managing, and administering neighborhoods.

## Module Structure

### 1. **Screens/Pages** (6 main screens)

#### A. **Neighborhood Discovery** (`/neighborhood-discovery`)
- **File:** `frontend/src/app/screens/NeighborhoodDiscovery.tsx`
- **Features:**
  - Search neighborhoods by name, city, or state
  - Browse neighborhoods grouped by city
  - View neighborhood cards with verification badges
  - Quick access to propose new neighborhoods
  - Displays verified status and key metrics (population, landmarks)
- **Navigation:** From home > explore neighborhoods
- **Key Components:** Search input, city grouping, neighborhood cards

#### B. **Browse Neighborhoods** (`/neighborhoods`)
- **File:** `frontend/src/app/screens/BrowseNeighborhoods.tsx`
- **Features:**
  - Comprehensive list view of all neighborhoods
  - Search functionality across name, city, and description
  - Verification badge indicators
  - Quick link to proposal form
- **Navigation:** Main neighborhoods browsing interface
- **Differences from Discovery:** Linear list vs. grouped layout

#### C. **Propose Neighborhood** (`/propose-neighborhood`)
- **File:** `frontend/src/app/screens/ProposeNeighborhood.tsx`
- **Features:**
  - Form-based proposal submission
  - Required fields: Name, City, State, Description, Primary Landmark
  - Automatic proposer information capture
  - Form validation
  - Success redirect to proposal status
- **Navigation:** From discovery/browse screens > propose button
- **Submission Flow:** 
  1. User fills form → 2. Submits proposal → 3. Redirects to status page

#### D. **Proposal Status** (`/proposal-status`)
- **File:** `frontend/src/app/screens/NeighborhoodProposalStatus.tsx`
- **Features:**
  - View all user's neighborhood proposals
  - Status display: Pending, Approved, or Rejected
  - View submitted details and review dates
  - Display admin review notes
  - Action buttons based on status:
    - Pending: Shows review timeline
    - Approved: "Visit Your Neighborhood" button
    - Rejected: "Submit New Proposal" button
- **Navigation:** Automatic after proposal submission
- **Status Colors:**
  - Pending: Yellow
  - Approved: Green
  - Rejected: Red

#### E. **Hub Settings** (`/hub-settings`)
- **File:** `frontend/src/app/screens/HubSettings.tsx`
- **Features:**
  - Access restricted to neighborhood leads
  - Branding management (cover photo, logo)
  - Feature toggles for:
    - Marketplace
    - Resource Exchange
    - Public Alerts
    - Events
    - Services Directory
    - Verification Requirement
  - Community Guidelines editor (Markdown support)
  - Real-time toggle switching
- **Navigation:** From neighborhood detail (settings button) or admin only
- **Access Control:** Only shows for `currentUser.id === neighborhood.leadId`

#### F. **Neighborhood Detail** (`/neighborhood/:neighborhoodId`)
- **File:** `frontend/src/app/screens/NeighborhoodDetail.tsx`
- **Features:**
  - Complete neighborhood information display
  - Header with cover photo/gradient
  - Verification badge
  - Statistics: members, city, founding year
  - Lead information with "You" indicator
  - Primary landmark display
  - Active features showcase
  - Community guidelines display
  - Action buttons: Join, Browse other neighborhoods
- **Navigation:** From any neighborhood list view
- **Settings Access:** Lead only (settings button in header)

#### G. **Super Admin Dashboard** (`/super-admin-dashboard`)
- **File:** `frontend/src/app/screens/SuperAdminDashboard.tsx`
- **Features:**
  - Two-tab interface: Proposals | Neighborhoods
  - **Proposals Tab:**
    - Pending proposals with detailed review interface
    - Review form with notes textarea
    - Approve/Reject buttons with confirmation
    - Recently reviewed proposals display
  - **Neighborhoods Tab:**
    - List of all verified neighborhoods
    - Statistics display (members, city, created year)
    - Lead information
    - Delete confirmation modal
    - Delete functionality with warnings
  - Statistics counters for pending proposals and total neighborhoods
- **Navigation:** Restricted to admin users only
- **Access Control:** Checks `currentUser.isAdmin` before allowing access

### 2. **Service Layer** (`services/storage.ts`)

#### Neighborhoods Service
```typescript
neighborhoodsService = {
  getNeighborhoods()          // Fetch all neighborhoods from API
  getNeighborhood(id)         // Fetch specific neighborhood
  getCurrentNeighborhood()    // Get user's current neighborhood
  updateSettings(id, settings) // Update feature toggles
  updateGuidelines(id, text)  // Update community guidelines
  updateBranding(id, photo, logo) // Update cover photo and logo
  deleteNeighborhood(id)      // Delete neighborhood (NEW - for admin)
}
```

#### Proposals Service
```typescript
proposalsService = {
  getProposals()              // Fetch all proposals
  getProposal(id)             // Fetch specific proposal
  createProposal(data)        // Submit new proposal
  updateProposalStatus(id, status, notes) // Approve/Reject with notes
}
```

### 3. **Data Types** (`services/types.ts`)

```typescript
interface Neighborhood {
  id: string;
  name: string;
  city: string;
  state: string;
  description: string;
  population: number;
  primaryLandmark: string;
  leadId: string;
  leadName: string;
  verified: boolean;
  createdDate: string;
  coverPhoto?: string;
  settings: NeighborhoodSettings;
  guidelines: string;
}

interface NeighborhoodSettings {
  enableMarketplace: boolean;
  enableResourceExchange: boolean;
  enablePublicAlerts: boolean;
  enableEvents: boolean;
  enableServices: boolean;
  requireVerification: boolean;
}

interface NeighborhoodProposal {
  id: string;
  proposerId: string;
  proposerName: string;
  name: string;
  city: string;
  state: string;
  description: string;
  primaryLandmark: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedDate: string;
  reviewedDate?: string;
  reviewNotes?: string;
}
```

### 4. **Route Structure**

| Route | Component | Access | Purpose |
|-------|-----------|--------|---------|
| `/neighborhood-discovery` | NeighborhoodDiscovery | Public | Search & discover neighborhoods |
| `/neighborhoods` | BrowseNeighborhoods | Public | Browse all neighborhoods |
| `/neighborhood/:id` | NeighborhoodDetail | Public | View neighborhood details |
| `/propose-neighborhood` | ProposeNeighborhood | Authenticated | Submit neighborhood proposal |
| `/proposal-status` | NeighborhoodProposalStatus | Authenticated | Track proposal status |
| `/hub-settings` | HubSettings | Neighborhood Lead | Manage neighborhood settings |
| `/super-admin-dashboard` | SuperAdminDashboard | Super Admin | Manage proposals & neighborhoods |

## User Flows

### User Flow 1: Discovering & Joining a Neighborhood
```
Home/Browse → NeighborhoodDiscovery/BrowseNeighborhoods 
→ Search/Filter → NeighborhoodDetail → Join Neighborhood
```

### User Flow 2: Proposing a Neighborhood
```
NeighborhoodDiscovery/BrowseNeighborhoods 
→ "Propose New Neighborhood" → ProposeNeighborhood (form) 
→ Submit → ProposalStatus (shows pending)
→ (Admin reviews) → Status updates to Approved/Rejected
```

### User Flow 3: Managing Neighborhood (Lead Only)
```
NeighborhoodDetail → Settings button → HubSettings
→ Configure features, guidelines, branding → Save
```

### User Flow 4: Admin Dashboard
```
SuperAdminDashboard → Review pending proposals 
→ Add notes → Approve/Reject
OR
Neighborhoods tab → View all neighborhoods → Delete if needed
```

## Backend API Endpoints

The frontend calls these endpoints (base URL: `http://localhost:3000`):

```
GET  /neighborhoods              # Get all neighborhoods
GET  /neighborhoods/:id          # Get specific neighborhood
GET  /neighborhoods/current      # Get current user's neighborhood
POST /neighborhoods              # Create neighborhood (admin)
PUT  /neighborhoods/:id/settings # Update settings
PUT  /neighborhoods/:id/guidelines # Update guidelines
PUT  /neighborhoods/:id/branding # Update branding
DELETE /neighborhoods/:id        # Delete neighborhood (admin)

GET  /proposals                  # Get all proposals
GET  /proposals/:id              # Get specific proposal
POST /proposals                  # Create proposal
PUT  /proposals/:id/status       # Update proposal status (admin)
```

## Key Features

### 1. **Search & Discovery**
- Real-time filtering by neighborhood name, city, or state
- Geographic grouping for better organization
- Verification badges for trusted neighborhoods

### 2. **Proposal Management**
- Structured form with required fields
- Admin review interface with notes
- Clear status tracking for users
- Timeline display for review process

### 3. **Community Management**
- Feature toggles for customizable functionality
- Community guidelines editor
- Branding customization
- Lead-based access control

### 4. **Admin Controls**
- Comprehensive dashboard with two views
- Proposal review workflow
- Neighborhood deletion with confirmation
- Statistics overview

### 5. **Access Control**
- Public: Neighborhood browsing and detail pages
- Authenticated: Proposal submission and status
- Neighborhood Lead: Hub settings access
- Super Admin: Dashboard and management tools

## Security & Validation

### Front-End Validation
- All proposal forms require non-empty fields
- City/state format validation (2-letter state code)
- Character limits on certain fields
- Admin access check before loading dashboard

### Access Control
- Hub Settings only accessible if `currentUser.id === neighborhood.leadId`
- Super Admin Dashboard checks `currentUser.isAdmin`
- Sensitive operations have confirmation modals

## UI Components Used

- **Button** - Action triggers
- **Input** - Text input fields
- **Textarea** - Multi-line text (guidelines)
- **Switch** - Toggle features on/off
- **Icon Components** - MapPin, Users, Shield, etc.
- **Toast Notifications** - Success/error feedback
- **Modal Dialogs** - Delete confirmations

## Styling & Theme

- Primary color: `from-indigo-600 to-purple-600` for headers
- Card-based layout with `rounded-2xl` for modern appearance
- Verification badges with Shield icon
- Color-coded status indicators:
  - Yellow: Pending
  - Green: Approved/Active
  - Red: Rejected/Delete warnings
  - Blue: Information

## State Management

- **Local State**: Component-level state with `useState`
- **Async Operations**: Handled with async/await
- **Error Handling**: Toast notifications for user feedback
- **Loading States**: Loading indicators during data fetch

## Testing Checklist

- [ ] Navigation between all neighborhood screens
- [ ] Search functionality in Discovery and Browse
- [ ] Proposal form submission and validation
- [ ] Status tracking updates
- [ ] Hub Settings save functionality
- [ ] Feature toggle switches
- [ ] Admin review and approval workflow
- [ ] Neighborhood deletion confirmation
- [ ] Access control (admin/lead only pages)
- [ ] Error handling and toast notifications

## Future Enhancements

1. **Map Integration** - Display neighborhoods on interactive map
2. **Geofencing** - Automatic neighborhood detection based on location
3. **Image Upload** - Replace simulated uploads with real image handling
4. **Advanced Filtering** - Filter by features, member count, etc.
5. **Neighborhood Stats** - More detailed analytics and metrics
6. **Member Management** - Add/remove members, change roles
7. **Activity Feed** - Neighborhood-specific activity timeline
8. **Email Notifications** - Notify proposers of status changes
9. **Batch Operations** - Admin bulk actions
10. **Audit Trail** - Log all admin actions

## Troubleshooting

### Issue: Hub Settings not showing
**Solution:** Ensure user ID matches `neighborhood.leadId`

### Issue: Super Admin Dashboard not accessible
**Solution:** Confirm user has `isAdmin: true` in auth service

### Issue: Proposal not saving
**Solution:** Check all required fields are filled; review browser console for API errors

### Issue: Neighborhoods not loading
**Solution:** Verify backend API is running at `http://localhost:3000`

## File Locations

```
frontend/src/app/
├── screens/
│   ├── NeighborhoodDiscovery.tsx
│   ├── BrowseNeighborhoods.tsx
│   ├── ProposeNeighborhood.tsx
│   ├── NeighborhoodProposalStatus.tsx
│   ├── HubSettings.tsx
│   ├── NeighborhoodDetail.tsx
│   └── SuperAdminDashboard.tsx
├── services/
│   ├── storage.ts (includes neighborhoodsService, proposalsService)
│   └── types.ts (Neighborhood, NeighborhoodProposal, NeighborhoodSettings)
└── routes.ts (all routes defined)
```

## Configuration

No additional configuration needed. The module uses:
- Existing authentication service
- Existing toast notification system
- Existing storage service with local storage fallback
- Backend API at `http://localhost:3000` (configurable in `storage.ts`)

---

**Last Updated:** May 1, 2026
**Module Status:** ✅ Fully Integrated
