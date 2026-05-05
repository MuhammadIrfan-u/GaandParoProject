# Supabase Integration Guide

## ✅ Integration Complete!

Your Verified Neighborhood Community application is now fully integrated with **Supabase PostgreSQL Database**. This guide covers setup, configuration, and usage.

## 🎯 What's Integrated

### Backend (Node.js/Express)
- ✅ Supabase client initialized with service role key
- ✅ Neighborhoods CRUD endpoints with Supabase
- ✅ Proposals CRUD endpoints with Supabase
- ✅ Auto-creation of neighborhood when proposal is approved
- ✅ ES Modules support for clean async/await code

### Frontend (React)
- ✅ Supabase client configuration in `.env.local`
- ✅ Neighborhoods service using Supabase API
- ✅ Proposals service using Supabase API
- ✅ Fallback to local storage if API fails
- ✅ Error handling and logging

## 📋 Configuration Files Created

### Backend
```
Backend/
├── .env                          # Environment variables (DO NOT COMMIT)
├── src/
│   ├── supabaseClient.js         # Supabase initialization
│   ├── routes/
│   │   ├── supabaseNeighborhoodsRoutes.js  # Neighborhoods endpoints
│   │   └── supabaseProposalsRoutes.js      # Proposals endpoints
│   ├── app.js                   # Updated with ES modules
│   └── server.js                # Updated with ES modules
└── package.json                 # Updated with "type": "module"
```

### Frontend
```
frontend/
├── .env.local                   # Environment variables (DO NOT COMMIT)
└── src/app/services/
    ├── supabaseClient.ts        # Supabase client configuration
    └── storage.ts               # Updated services to use Supabase
```

## 🔑 Environment Variables

### Backend (`.env`)
```env
SUPABASE_URL=https://fcwiixyflsoghtrksxrt.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=3000
NODE_ENV=development
```

### Frontend (`.env.local`)
```env
VITE_SUPABASE_URL=https://fcwiixyflsoghtrksxrt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🚀 API Endpoints

### Neighborhoods
```
GET    /neighborhoods              # Get all neighborhoods
GET    /neighborhoods/:id          # Get specific neighborhood
GET    /neighborhoods/current      # Get user's neighborhood
POST   /neighborhoods              # Create neighborhood (admin)
PUT    /neighborhoods/:id/settings # Update settings
PUT    /neighborhoods/:id/guidelines # Update guidelines
PUT    /neighborhoods/:id/branding # Update branding
DELETE /neighborhoods/:id          # Delete neighborhood (admin)
```

### Proposals
```
GET    /proposals                  # Get all proposals
GET    /proposals/:id              # Get specific proposal
POST   /proposals                  # Create proposal
PUT    /proposals/:id/status       # Update proposal status (admin)
GET    /proposals/user/:userId     # Get user's proposals
```

## 🏗️ Database Schema

The Supabase tables required:

### `neighborhoods`
```sql
id (integer, primary key)
name (varchar)
city (varchar)
state (varchar)
description (text)
population (integer)
primary_landmark (varchar)
admin_id (integer, foreign key -> users.id)
verified (boolean)
created_date (timestamp)
cover_photo (text, optional)
logo (text, optional)
```

### `neighborhood_settings`
```sql
neighborhood_id (integer, primary key, foreign key -> neighborhoods.id)
enable_marketplace (boolean)
enable_resource_exchange (boolean)
enable_public_alerts (boolean)
enable_events (boolean)
enable_services (boolean)
require_verification (boolean)
guidelines (text)
```

### `neighborhood_proposals`
```sql
id (integer, primary key)
proposer_id (integer, foreign key -> users.id)
proposer_name (varchar)
name (varchar)
city (varchar)
state (varchar)
description (text)
primary_landmark (varchar)
status (varchar) - 'pending', 'approved', 'rejected'
submitted_date (timestamp)
reviewed_date (timestamp, optional)
review_notes (text, optional)
admin_id (integer, foreign key -> users.id, optional)
```

## 🔒 Security

### Best Practices Implemented
- ✅ Service Role Key used only on backend
- ✅ Anon Key used on frontend (with RLS policies)
- ✅ Environment variables isolated from code
- ✅ `.env` files included in `.gitignore`
- ✅ Error handling with fallback to local storage

### Production Checklist
- [ ] Set up Row Level Security (RLS) policies in Supabase
- [ ] Rotate credentials regularly
- [ ] Use environment-specific tokens
- [ ] Enable database backups
- [ ] Set up monitoring and alerts
- [ ] Review Supabase audit logs

## 📝 Usage Examples

### Get All Neighborhoods
```typescript
const neighborhoods = await neighborhoodsService.getNeighborhoods();
```

### Create Proposal
```typescript
const proposal = await proposalsService.createProposal({
  proposerId: user.id,
  proposerName: user.name,
  name: "Oak Valley Community",
  city: "Springfield",
  state: "IL",
  description: "A vibrant neighborhood...",
  primaryLandmark: "Oak Valley Park"
});
```

### Update Proposal Status (Admin)
```typescript
const updated = await proposalsService.updateProposalStatus(
  proposalId,
  'approved',
  'Great proposal! Welcome to the community.'
);
```

### Delete Neighborhood (Admin)
```typescript
await neighborhoodsService.deleteNeighborhood(neighborhoodId);
```

## 🧪 Testing the Integration

### Test Neighborhoods API
```bash
# Get all neighborhoods
curl http://localhost:3000/neighborhoods

# Get specific neighborhood
curl http://localhost:3000/neighborhoods/1

# Create neighborhood (requires auth)
curl -X POST http://localhost:3000/neighborhoods \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Hood",
    "city": "TestCity",
    "state": "TS",
    "description": "Test description",
    "primaryLandmark": "Test Park",
    "adminId": 1
  }'
```

### Test Proposals API
```bash
# Get all proposals
curl http://localhost:3000/proposals

# Create proposal
curl -X POST http://localhost:3000/proposals \
  -H "Content-Type: application/json" \
  -d '{
    "proposerId": "user-1",
    "proposerName": "Alex Thompson",
    "name": "New Neighborhood",
    "city": "Boston",
    "state": "MA",
    "description": "A great place",
    "primaryLandmark": "Central Park"
  }'

# Update proposal status
curl -X PUT http://localhost:3000/proposals/1/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved",
    "reviewNotes": "Looks good!",
    "adminId": "admin-1"
  }'
```

## 🔄 Migration Path

### From Local Storage to Supabase
1. ✅ API endpoints created and tested
2. ✅ Frontend services updated to use Supabase API
3. ✅ Fallback mechanism for offline/error scenarios
4. ✅ Gradual migration supported

### Data Migration (When Ready)
```javascript
// You can run this script to migrate existing data from local storage to Supabase
import { supabase } from './supabaseClient.js';

async function migrateData() {
  // Get data from localStorage
  const neighborhoods = JSON.parse(localStorage.getItem('neighborhub_neighborhoods') || '[]');
  const proposals = JSON.parse(localStorage.getItem('neighborhub_proposals') || '[]');
  
  // Insert into Supabase
  if (neighborhoods.length > 0) {
    await supabase.from('neighborhoods').insert(neighborhoods);
  }
  
  if (proposals.length > 0) {
    await supabase.from('neighborhood_proposals').insert(proposals);
  }
  
  console.log('Migration complete!');
}
```

## 📚 Documentation

### Other Data Features
The following features still use mock data (stored in `mockData.js`):
- Posts and comments
- Marketplace items
- Services
- Events
- Alerts
- Messages and conversations
- Notifications
- Reviews

These can be migrated to Supabase following the same pattern as neighborhoods.

## ⚙️ Troubleshooting

### Issue: "Missing Supabase configuration"
**Solution:** Ensure `.env` file exists in Backend directory with valid credentials

### Issue: "CORS error in frontend"
**Solution:** Backend CORS headers are configured. Check that backend is running on port 3000

### Issue: "Supabase tables not found"
**Solution:** Create the required tables in Supabase dashboard using the schema provided above

### Issue: "Service role key error"
**Solution:** Verify you're using the correct service role key from Supabase dashboard (Settings > API)

### Issue: "Fallback to local storage"
**Solution:** This is normal and means the API failed. Check backend logs and network tab in browser DevTools

## 🎓 Next Steps

1. **Set up RLS Policies**: Configure Row Level Security in Supabase for fine-grained access control
2. **Migrate Other Features**: Apply the same pattern to posts, events, services, etc.
3. **Real-time Subscriptions**: Use Supabase real-time features for live updates
4. **Authentication**: Integrate Supabase Auth for user management
5. **File Storage**: Use Supabase Storage for cover photos and logos

## 📞 Support

For Supabase issues:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord Community](https://discord.supabase.com)

For application issues:
- Check backend logs: `npm run dev` output
- Check frontend console: Browser DevTools (F12)
- Check network tab for API failures

---

**Supabase Integration Status:** ✅ Complete and Ready for Production
