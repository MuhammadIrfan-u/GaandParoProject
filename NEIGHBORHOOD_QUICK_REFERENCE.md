# Neighborhood Module - Quick Reference

## 🚀 Quick Start

### To Navigate Between Screens:
```typescript
// Discover neighborhoods
navigate("/neighborhood-discovery");

// Browse all neighborhoods  
navigate("/neighborhoods");

// View specific neighborhood
navigate("/neighborhood/neighborhood-123");

// Propose new neighborhood
navigate("/propose-neighborhood");

// Check proposal status
navigate("/proposal-status");

// Manage neighborhood settings (lead only)
navigate("/hub-settings");

// Admin dashboard
navigate("/super-admin-dashboard");
```

## 📱 Screen Features at a Glance

| Screen | Purpose | Key Actions | Access |
|--------|---------|-------------|--------|
| Neighborhood Discovery | Search & discover | Search, Filter, Propose | Public |
| Browse Neighborhoods | View all | List, Search | Public |
| Neighborhood Detail | View info | Join, Browse other | Public |
| Propose Neighborhood | Submit proposal | Fill form, Submit | Authenticated |
| Proposal Status | Track status | View status, resubmit | Authenticated |
| Hub Settings | Manage neighborhood | Toggle features, edit guidelines | Neighborhood Lead |
| Super Admin Dashboard | Manage community | Review proposals, delete neighborhoods | Super Admin |

## 🔑 Key Types

```typescript
// Neighborhood
{
  id, name, city, state, description,
  population, primaryLandmark, leadId, leadName,
  verified, createdDate, coverPhoto, settings, guidelines
}

// NeighborhoodProposal
{
  id, proposerId, proposerName, name, city, state,
  description, primaryLandmark, status, submittedDate,
  reviewedDate?, reviewNotes?
}

// NeighborhoodSettings
{
  enableMarketplace, enableResourceExchange,
  enablePublicAlerts, enableEvents, enableServices,
  requireVerification
}
```

## 🛠️ Service Methods

```typescript
// Neighborhoods Service
neighborhoodsService.getNeighborhoods()
neighborhoodsService.getNeighborhood(id)
neighborhoodsService.getCurrentNeighborhood()
neighborhoodsService.updateSettings(id, settings)
neighborhoodsService.updateGuidelines(id, text)
neighborhoodsService.updateBranding(id, photo?, logo?)
neighborhoodsService.deleteNeighborhood(id)  // NEW

// Proposals Service
proposalsService.getProposals()
proposalsService.getProposal(id)
proposalsService.createProposal(data)
proposalsService.updateProposalStatus(id, status, notes?)
```

## 🔒 Access Control

```typescript
// Neighborhood Lead Access
const isLead = currentUser.id === neighborhood.leadId;
// Shows settings button in neighborhood detail

// Super Admin Access
const isAdmin = currentUser.isAdmin;
// Allows dashboard access and management operations
```

## 🎨 Color Scheme

```
Primary Headers: from-indigo-600 to-purple-600
Success/Approved: Green (#16a34a)
Pending: Yellow (#ca8a04)
Rejected/Delete: Red (#dc2626)
Info/Blueprint: Blue (#3b82f6)
Neutral: Gray (muted-foreground)
```

## 📊 API Endpoints Reference

```
GET  /neighborhoods
GET  /neighborhoods/{id}
GET  /neighborhoods/current
POST /neighborhoods
PUT  /neighborhoods/{id}/settings
PUT  /neighborhoods/{id}/guidelines
PUT  /neighborhoods/{id}/branding
DELETE /neighborhoods/{id}

GET  /proposals
GET  /proposals/{id}
POST /proposals
PUT  /proposals/{id}/status
```

## ✨ Common Patterns

### Loading Neighborhoods
```typescript
const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  neighborhoodsService.getNeighborhoods()
    .then(setNeighborhoods)
    .catch(() => toast.error("Failed to load"))
    .finally(() => setLoading(false));
}, []);
```

### Submitting Proposal
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!formValidation()) {
    toast.error("Invalid form");
    return;
  }
  
  setSubmitting(true);
  try {
    await proposalsService.createProposal({
      proposerId: currentUser.id,
      proposerName: currentUser.name,
      ...formData
    });
    toast.success("Proposal submitted!");
    navigate("/proposal-status");
  } catch (error) {
    toast.error("Failed to submit");
  } finally {
    setSubmitting(false);
  }
};
```

### Toggling Feature
```typescript
const handleToggle = (key: keyof NeighborhoodSettings) => {
  setSettings({ ...settings, [key]: !settings[key] });
};
```

### Admin Review Flow
```typescript
const handleApprove = async (proposalId: string) => {
  if (!reviewNotes.trim()) {
    toast.error("Add review notes");
    return;
  }
  
  await proposalsService.updateProposalStatus(
    proposalId, 
    'approved', 
    reviewNotes
  );
  toast.success("Proposal approved!");
  await loadData(); // Refresh
};
```

## 🐛 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Hub Settings 404 | User not neighborhood lead | Check `leadId === currentUser.id` |
| Admin Dashboard 403 | User not admin | Set `isAdmin: true` in auth service |
| API Errors | Backend not running | Start backend at `http://localhost:3000` |
| Form won't submit | Validation error | Check all required fields filled |
| Neighborhoods empty | No data in store | Populate mock data or seed database |
| Navigation not working | Route not defined | Check `routes.ts` for route definition |

## 🔄 State Management Flow

```
Component Mount
    ↓
useEffect Hook
    ↓
Call Service → API/localStorage
    ↓
setLoading(false), setState(data)
    ↓
Render with data
    ↓
User Action (click, submit, toggle)
    ↓
Handle Event → Call Service
    ↓
Update State → Re-render
    ↓
Toast Notification (success/error)
```

## 📋 Routes Configuration

All routes are defined in `routes.ts`:

```typescript
{
  path: "/neighborhood-discovery",
  Component: NeighborhoodDiscovery,
},
{
  path: "/neighborhoods",
  Component: BrowseNeighborhoods,
},
{
  path: "/neighborhood/:neighborhoodId",
  Component: NeighborhoodDetail,
},
// ... etc
```

## 🧪 Testing Tips

1. **Test discovery search**: Use various city names and states
2. **Test proposal flow**: Complete form submission and check status updates
3. **Test admin functions**: Use admin account for dashboard access
4. **Test validation**: Try submitting empty forms
5. **Test permissions**: Verify lead-only access to settings
6. **Test navigation**: Verify all link navigations work

## 📝 Notes for Backend Integration

- Update API endpoints in `storage.ts` `API_BASE` constant
- Ensure backend returns data in expected format
- Handle pagination for neighborhoods list (if needed)
- Implement proper error responses with status codes
- Add authentication token headers to API calls
- Validate all input on backend side as well

---

**Module Ready for Production!** ✅
